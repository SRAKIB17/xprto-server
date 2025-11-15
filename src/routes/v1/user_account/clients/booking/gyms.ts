import { find, insert, mysql_date, mysql_datetime, sanitize } from "@tezx/sqlx/mysql";
import { Router } from "tezx";
import { generateUUID } from "tezx/helper";
import { dbQuery, TABLES } from "../../../../../models/index.js";
import { performWalletTransaction } from "../../../../../utils/createWalletTransaction.js";
import { generateTxnID } from "../../../../../utils/generateTxnID.js";
import { adminWallet } from "../../../../../config.js";

// import user_account_document_flag from "./flag-document.js";
const gymsBooking = new Router({
    basePath: '/gyms'
});

gymsBooking.post("/trial", async (ctx) => {
    const { user_id, email } = ctx.auth?.user_info || {};
    const { role } = ctx.auth || {};
    if (!user_id || !role) {
        return ctx.status(401).json({ success: false, message: "Unauthorized" });
    }
    const {
        date: { day, month, year },
        session: { session_id },
        gym: { gym_id, trial_price, gym_name },
    } = await ctx.req.json();

    const txn_id = generateTxnID("TRAIL");
    const idempotency_key = generateUUID();

    // 💰 User Wallet Debit
    const { success: debitSuccess } = await performWalletTransaction(
        { role, user_id },
        {
            amount: Number(trial_price),
            type: "payment",
            payment_method: "wallet",
            external_txn_id: txn_id,
            idempotency_key,
            note: `Payment trial. Gym(${gym_name})`,
            reference_type: "trial_gym",
        }
    );
    if (!debitSuccess) {
        return ctx.status(400).json({ success: false, message: "Insufficient balance or payment failed" });
    }

    // 💰 Admin Wallet Credit
    await performWalletTransaction(
        { role: adminWallet.role, user_id: adminWallet.admin_id },
        {
            amount: Number(trial_price),
            type: "transfer_in",
            payment_method: "wallet",
            external_txn_id: txn_id,
            idempotency_key: generateUUID(),
            reference_id: idempotency_key,
            note: `Payment trial. Gym(${gym_name}). UserID: (${user_id})`,
            reference_type: "trial_gym",
        }
    );

    // 📝 Insert Booking
    const sql = insert(TABLES.CLIENTS.GYM_TRIAL_BOOKING, {
        client_id: user_id,
        gym_id,
        session_id,
        day,
        month,
        year,
        txn_id,
        reference: "trial_gym",
        idempotent_key: idempotency_key
    });

    const { success: dbSuccess, result, error } = await dbQuery(sql);
    console.log(error)
    if (!dbSuccess) {
        return ctx.status(500).json({ success: false, message: "Failed to create booking" });
    }

    return ctx.json({
        success: true,
        message: "Booking successful",
        payment_txn_id: txn_id,
        booking: result,
    });
});

export default gymsBooking;
