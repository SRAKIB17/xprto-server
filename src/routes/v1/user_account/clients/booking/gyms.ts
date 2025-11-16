import { find, insert, mysql_date, mysql_datetime, sanitize } from "@tezx/sqlx/mysql";
import { Router } from "tezx";
import { generateUUID } from "tezx/helper";
import { dbQuery, TABLES } from "../../../../../models/index.js";
import { performWalletTransaction } from "../../../../../utils/createWalletTransaction.js";
import { generateTxnID } from "../../../../../utils/generateTxnID.js";
import { adminWallet } from "../../../../../config.js";
import paginationHandler from "tezx/middleware/pagination.js";

// import user_account_document_flag from "./flag-document.js";
const gymsBooking = new Router({
    basePath: '/gyms'
});
gymsBooking.get(
    "/trial",
    paginationHandler({
        getDataSource: async (ctx, { page, limit, offset }) => {
            const { role } = ctx.auth || {};
            const { year, month, day } = ctx?.req.query;
            const { user_id, username, hashed, salt, email } = ctx.auth?.user_info || {};
            let condition = `tb.client_id = ${user_id}`
            if (year) {
                condition += ` AND tb.year = ${sanitize(year)}`
            }
            if (month) {
                condition += ` AND tb.month = ${sanitize(month)}`
            }
            if (day) {
                condition += ` AND tb.day = ${sanitize(day)}`
            }
            let sql = find(`${TABLES.CLIENTS.GYM_TRIAL_BOOKING} as tb`, {
                sort: {
                    booking_id: -1
                },
                joins: `LEFT JOIN ${TABLES.GYMS.SESSIONS} as s ON s.session_id = tb.session_id
                LEFT JOIN ${TABLES.GYMS.gyms} as g ON g.gym_id = s.gym_id
                `,
                columns: `
                tb.*, s.*, g.gym_name, g.phone, g.address, g.postal_code, g.country, g.district
                `,
                limitSkip: {
                    limit: limit,
                    skip: offset
                },
                where: condition,
            })
            let count = find(`${TABLES.CLIENTS.GYM_TRIAL_BOOKING} as tb`, {
                columns: 'count(*) as count',
                where: condition,
            })
            const { success, result, error } = await dbQuery<any[]>(`${sql}${count}`);
            if (!success) {
                return {
                    data: [],
                    total: 0
                }
            }
            return {
                data: result?.[0],
                total: result?.[1]?.[0]?.count
            }
        },
    })
);

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
