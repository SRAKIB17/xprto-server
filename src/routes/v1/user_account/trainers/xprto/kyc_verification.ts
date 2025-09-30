import { Router } from "tezx";
import { dbQuery, TABLES } from "../../../../../models/index.js";
import { find, insert, mysql_date, mysql_datetime, sanitize, update } from "@tezx/sqlx/mysql";
import { AppNotificationToast } from "../../../../websocket/notification.js";
import { generateTxnID } from "../../../../../utils/generateTxnID.js";
import { copyFile } from "../../../../../utils/fileExists.js";
import { DirectoryServe, filename } from "../../../../../config.js";
import { performWalletTransaction } from "../../../../../utils/createWalletTransaction.js";

// import user_account_document_flag from "./flag-document.js";
const KYC = new Router({
    basePath: "/kyc"
});

// CREATE TABLE trainer_kyc_verification(
//     kyc_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
//     trainer_id BIGINT UNSIGNED NOT NULL UNIQUE,

//     --KYC Details
//     document_type ENUM('nid', 'passport', 'aadhaar', 'pan') NOT NULL,
//     document_number VARCHAR(100) NOT NULL,
//     document_file JSON NOT NULL, --multiple files(front / back / address proof)

//     --Verification Status
//     status ENUM('not_submitted', 'in_review', 'verified', 'rejected', 'blocked') DEFAULT 'not_submitted',
//     rejection_reason VARCHAR(255) NULL,

//     --Attempts & Payment
//     attempts TINYINT UNSIGNED DEFAULT 0, --কতবার চেষ্টা করেছে
//     paid_first_attempt BOOLEAN DEFAULT FALSE, --প্রথমবার পেমেন্ট দিয়েছে কি না

//     --Audit Fields
//     verified_at TIMESTAMP NULL,
//     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
//     --Relations
//     FOREIGN KEY(trainer_id) REFERENCES trainers(trainer_id) ON DELETE CASCADE
// );
KYC.get("/:verified_for", async (ctx) => {
    const { user_id, email } = ctx.auth?.user_info || {};
    const { role } = ctx.auth || {};
    const { verified_for } = ctx.req.params;
    if (!user_id || !role) {
        return ctx.status(401).json({ message: "Unauthorized" });
    }

    const { result: kyc } = await dbQuery(
        find(TABLES.TRAINERS.kyc_verification, {
            where: `trainer_id = ${user_id} AND verified_for = ${sanitize(verified_for)}`,
            limitSkip: { limit: 1 },
        })
    );

    if (kyc?.length) {
        return ctx.json({ kyc: kyc[0] });
    }

    const { result, success, error } = await dbQuery<any>(
        insert(TABLES.TRAINERS.kyc_verification, {
            trainer_id: user_id,
            verified_for: (verified_for === 'kyc' || verified_for === 'assured') ? verified_for : 'kyc'
        })
    );

    if (!success) {
        AppNotificationToast(ctx, {
            message: "Failed to create kyc",
            title: "Create KYC",
            type: "error"
        })
        return ctx.status(500).json({ message: "Failed to create kyc" });
    }

    const { result: newKYC } = await dbQuery(
        find(TABLES.TRAINERS.kyc_verification, {
            where: `kyc_id = ${result.insertId}`,
            limitSkip: { limit: 1 },
        })
    );
    return ctx.json({ kyc: newKYC?.[0] });
});

KYC.post("/kyc", async (ctx) => {
    const { user_id, email } = ctx.auth?.user_info || {};
    const { role } = ctx.auth || {};
    const { verified_for } = ctx.req.params;
    if (!user_id || !role) {
        return ctx.status(401).json({ message: "Unauthorized" });
    }
    let txn_id = generateTxnID(verified_for?.toUpperCase());
    const {
        fullname,
        dob,
        document_type,
        document_number,
        document_file,
        old,
        selfie,
        pay_amount,
    } = await ctx.req.json();

    let documents = [];
    if (Array.isArray(document_file)) {
        for (const file of document_file) {
            if (await copyFile(file, DirectoryServe.verifications.KYC(file), true)) {
                documents.push(filename(file))
            }
        }
    }
    if (
        Array.isArray(documents) &&
        (
            (document_type === 'aadhaar' && documents?.length !== 2) ||
            (document_type === 'pan' && documents?.length !== 1)
        )
    ) {
        return ctx.status(400).json({ message: "Please upload documents again!" });
    }

    let finalSelfie;
    if (await copyFile(selfie, DirectoryServe.verifications.SELFIE(selfie), true)) {
        finalSelfie = filename(selfie)
    }
    if (!finalSelfie) {
        return ctx.status(400).json({ message: "Please upload again your selfie!" });
    }

    // ---- Check if KYC exists ----
    const { result: existingKYC } = await dbQuery<any>(
        find(TABLES.TRAINERS.kyc_verification, {
            where: `trainer_id = ${sanitize(user_id)} AND verified_for = ${sanitize(verified_for)}`,
            limitSkip: { limit: 1 },
        })
    );
    if (!existingKYC[0]?.paid_first_attempt) {
        await performWalletTransaction(ctx, {
            amount: pay_amount,
            type: 'payment',
            external_txn_id: txn_id,
            note: "Payment KYC verification",
            reference_type: "kyc_payment"
        })
    }
    // ---- Update old KYC ----
    const { success } = await dbQuery(
        update(TABLES.TRAINERS.kyc_verification, {
            values: {
                fullname,
                dob,
                document_type,
                document_number,
                document_file: JSON.stringify(documents),
                selfie: finalSelfie,
                status: "in_review",
                txn_id: existingKYC[0].txn_id || txn_id,
                paid_first_attempt: 1,
                verified_for,
                updated_at: mysql_datetime(),
            },
            setCalculations: { attempts: "attempts + 1" },
            where: `trainer_id = ${sanitize(user_id)} AND kyc_id = ${existingKYC[0].kyc_id}`,
        })
    );

    if (!success) {
        return ctx.status(500).json({ message: "Failed to update KYC" });
    }

    let kycRow = (await dbQuery<any>(
        find(TABLES.TRAINERS.kyc_verification, {
            where: `kyc_id = ${existingKYC[0].kyc_id}`,
            limitSkip: { limit: 1 },
        })
    )).result?.[0];
    return ctx.json({ success: true, kyc: kycRow });

    // else {
    //     // ---- Insert new KYC ----
    //     const { result, success } = await dbQuery<any>(
    //         insert(TABLES.TRAINERS.kyc_verification, {
    //             trainer_id: user_id,
    //             verified_for: (verified_for === "kyc" || verified_for === "assured") ? verified_for : "kyc",
    //             fullname,
    //             dob,
    //             document_type,
    //             document_number,
    //             document_file: JSON.stringify(documents),
    //             selfie: finalSelfie,
    //             status: "in_review",
    //             txn_id,
    //             paid_first_attempt: 1,
    //             created_at: mysql_datetime(),
    //             updated_at: mysql_datetime(),
    //         })
    //     );

    //     if (!success) {
    //         return ctx.status(500).json({ message: "Failed to create KYC" });
    //     }
    //     kycRow = (await dbQuery<any>(
    //         find(TABLES.TRAINERS.kyc_verification, {
    //             where: `kyc_id = ${result.insertId}`,
    //             limitSkip: { limit: 1 },
    //         })
    //     )).result?.[0];
    // }
    return ctx.json({ kyc: kycRow });
});
// xprtoTrainersVerifications.use(clientFeedback);
// xprtoTrainersVerifications.use(myServices);



export default KYC;