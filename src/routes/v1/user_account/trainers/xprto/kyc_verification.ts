import { find, insert, mysql_datetime, sanitize, update } from "@tezx/sqlx/mysql";
import { Router } from "tezx";
import { generateUUID } from "tezx/helper";
import { DirectoryServe, filename } from "../../../../../config.js";
import { dbQuery, TABLES } from "../../../../../models/index.js";
import { performWalletTransaction } from "../../../../../utils/createWalletTransaction.js";
import { copyFile } from "../../../../../utils/fileExists.js";
import { generateTxnID } from "../../../../../utils/generateTxnID.js";
import { AppNotificationToast } from "../../../../websocket/notification.js";
import { appsDataAmountEtc } from "../../../apps.js";

// import user_account_document_flag from "./flag-document.js";
const KYC = new Router({
    basePath: "/kyc"
});
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
            type: "error" as any,
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
    if (!user_id || !role) {
        return ctx.status(401).json({ message: "Unauthorized" });
    }
    let txn_id = generateTxnID("KYC");
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
    // ---- Check if KYC exists ----
    const { result: existingKYC } = await dbQuery<any>(
        find(TABLES.TRAINERS.kyc_verification, {
            where: `trainer_id = ${sanitize(user_id)} AND verified_for = 'kyc'`,
            limitSkip: { limit: 1 },
        })
    );
    let paidDone = !!existingKYC[0]?.paid_first_attempt;
    if (!existingKYC[0]?.paid_first_attempt) {
        let { success } = await performWalletTransaction({
            role: role,
            user_id: user_id,
        }, {
            amount: pay_amount,
            type: 'payment',
            payment_method: "wallet",
            external_txn_id: txn_id,
            idempotency_key: generateUUID(),
            note: "Payment KYC verification",
            reference_type: "kyc_payment"
        })
        paidDone = success;
    }
    if (!paidDone) {
        if (!paidDone) {
            return ctx.json({
                success: false,
                message: "KYC payment failed. Please try again.",
            });
        }
    }

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
                verified_for: 'kyc',
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

KYC.post("/assured", async (ctx) => {
    const { user_id } = ctx.auth?.user_info || {};
    const { role } = ctx.auth || {};
    const verified_for = "assured";
    if (!user_id || !role) {
        return ctx.status(401).json({ message: "Unauthorized" });
    }
    const {
        certificates,
        pvc
    } = await ctx.req.json()
    let amount = appsDataAmountEtc?.assured_amount?.amount;

    let txn_id = generateTxnID("ASSRD");
    let { success: paymentSuccess, error } = await performWalletTransaction({
        role: role,
        user_id: user_id,
    }, {
        amount: amount,
        type: 'hold',
        payment_method: "wallet",
        external_txn_id: txn_id,
        idempotency_key: generateUUID(),
        note: "Security XPRTO assured verification",
        reference_type: "assured_hold"
    });
    if (!paymentSuccess) {
        return ctx.json({ success: false, massage: error ?? "Payment Failed. Please try again or contact support system!" })
    }

    let documents = [];
    if (await copyFile(pvc, DirectoryServe.verifications.ASSURED(pvc), true)) {
        documents.push(filename(pvc))
    }
    if (Array.isArray(certificates)) {
        for (const file of certificates) {
            if (await copyFile(file, DirectoryServe.verifications.ASSURED(file), true)) {
                documents.push(filename(file))
            }
        }
    }
    if (Array.isArray(documents) && documents?.length < 2) {
        return ctx.status(400).json({ message: "Please upload documents again!" });
    }

    const { result: existingKYC } = await dbQuery<any>(
        find(TABLES.TRAINERS.kyc_verification, {
            where: `trainer_id = ${sanitize(user_id)} AND verified_for = ${sanitize(verified_for)}`,
            limitSkip: { limit: 1 },
        })
    );

    // // ---- Update old KYC ----
    const { success } = await dbQuery(
        update(TABLES.TRAINERS.kyc_verification, {
            values: {
                document_file: JSON.stringify(documents),
                status: "in_review",
                verified_for,
                updated_at: mysql_datetime(),
            },
            setCalculations: { attempts: "attempts + 1" },
            where: `trainer_id = ${sanitize(user_id)} AND kyc_id = ${existingKYC[0].kyc_id}`,
        })
    );

    if (!success) {
        return ctx.status(500).json({ message: "Failed to update XPRTO assured" });
    }

    let kycRow = (await dbQuery<any>(
        find(TABLES.TRAINERS.kyc_verification, {
            where: `kyc_id = ${existingKYC[0].kyc_id}`,
            limitSkip: { limit: 1 },
        })
    )).result?.[0];
    return ctx.json({ success: true, kyc: kycRow });
});

export default KYC;