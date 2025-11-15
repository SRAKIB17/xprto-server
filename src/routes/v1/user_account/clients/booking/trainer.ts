import { find, insert, mysql_date, mysql_datetime, sanitize } from "@tezx/sqlx/mysql";
import { Router } from "tezx";
import { generateUUID } from "tezx/helper";
import { dbQuery, TABLES } from "../../../../../models/index.js";
import { performWalletTransaction } from "../../../../../utils/createWalletTransaction.js";
import { generateTxnID } from "../../../../../utils/generateTxnID.js";

// import user_account_document_flag from "./flag-document.js";
const trainerBooking = new Router({
    basePath: '/trainers'
});

trainerBooking.get("/:trainer_id", async (ctx) => {
    let condition = `t.is_online = 1 AND t.trainer_id = ${sanitize(ctx?.req?.params?.trainer_id)}`;

    let sql = find(`${TABLES.TRAINERS.trainers} as t`, {
        joins: `
    LEFT JOIN ${TABLES.TRAINERS.RED_FLAGS} as rf ON t.trainer_id = rf.trainer_id AND rf.status = 'active'
    LEFT JOIN ${TABLES.FEEDBACK.CLIENT_TRAINER} as fb ON fb.trainer_id = t.trainer_id
    LEFT JOIN ${TABLES.TRAINERS.services} as ms ON ms.trainer_id = t.trainer_id AND ms.status = 'active'
  `,
        columns: `
    t.*,
    COUNT(DISTINCT rf.red_flag_id) AS active_red_flags_count,
    ROUND(AVG(fb.rating), 2) AS rating,
    COUNT(DISTINCT fb.feedback_id) AS reviews,
    MIN(ms.price) AS min_price,
    TIMESTAMPDIFF(YEAR, t.dob, CURDATE()) as age,
    MAX(ms.price) AS max_price,
    COUNT(DISTINCT ms.service_id) AS total_services,
    GROUP_CONCAT(DISTINCT ms.delivery_mode) AS delivery_modes
  `,
        where: condition,
        groupBy: 't.trainer_id'
    });
    let { success, result } = await dbQuery(sql);
    return ctx.json({ success: success, trainer: result?.[0] })
})

trainerBooking.get('/:trainer_id/services', async (ctx) => {
    let { trainer_id } = await ctx.req.params;

    let sql = find(`${TABLES.TRAINERS.services} as ms`, {
        joins: `
    LEFT JOIN ${TABLES.TRAINERS.trainers} as t ON t.trainer_id = ms.trainer_id
    LEFT JOIN ${TABLES.TRAINERS.RED_FLAGS} as rf ON t.trainer_id = rf.trainer_id AND rf.status = 'active'
    `,
        columns: `
    ms.*,
    t.fullname,
    t.avatar,
    COUNT(DISTINCT rf.red_flag_id) AS active_red_flags_count
    `,
        sort: { service_id: -1 },
        groupBy: 'ms.service_id',
        where: `ms.trainer_id = ${sanitize(trainer_id)} AND ms.verify_status = "approved"`,
    });

    return ctx.json(await dbQuery<any[]>(`${sql}`))
})
trainerBooking.post("service", async (ctx) => {
    const { user_id, email } = ctx.auth?.user_info || {};
    const { role } = ctx.auth || {};

    if (!user_id || !role) {
        return ctx.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Extract payload from request
    const { payment_status, slot, client_note, range, select, location } = await ctx.req.json();
    const {
        service_id,
        trainer_id,
        title,
        description,
        details,
        package_name,
        package_features,
        price,
        discount,
        currency,
        duration_minutes,
        delivery_mode,
        requirements,
        video,
        images,
        faqs,
        status,
        verify_status,
        created_at,
        updated_at,
        attachments,
        per_unit,
        recurrence_type,
        recurrence_days,
        time_from,
        fullname,
        avatar,
        active_red_flags_count,
    } = select;

    const { start: startDate, end: endDate } = range;

    const requested_start = mysql_date(startDate);
    const requested_end = mysql_date(endDate);

    const booking_code = generateTxnID("BK");
    const txn_id = generateTxnID("KYC");
    const idempotency_key = generateUUID();

    // Calculate final price
    const discountAmount = (Number(price) * Number(discount || 0)) / 100;
    const finalPrice = Number(price) - discountAmount;

    // Perform wallet transaction
    const { success: walletSuccess } = await performWalletTransaction(
        { role, user_id },
        {
            amount: finalPrice,
            type: "hold",
            payment_method: "wallet",
            external_txn_id: txn_id,
            idempotency_key,
            note: `Payment Booking Trainer (${fullname})`,
            reference_type: "booking_trainer",
        }
    );

    if (!walletSuccess) {
        return ctx.status(400).json({ success: false, message: "Wallet transaction failed" });
    }

    // Insert booking into database
    const payload = {
        wallet_used: true,
        booking_code,
        delivery_mode,
        client_id: user_id,
        trainer_id,
        requested_start,
        requested_end,
        price: finalPrice,
        client_note,
        payment_txn_id: txn_id,
        idempotency_key,
        duration_minutes,
        time_from,
        location: location ?? null,
        discount_percent: discount,
        service_id,
        per_unit,
    };

    const { success: dbSuccess, result } = await dbQuery(
        insert(TABLES.TRAINERS.BOOKING_REQUESTS, payload as any)
    );

    if (!dbSuccess) {
        return ctx.status(500).json({ success: false, message: "Failed to create booking" });
    }

    return ctx.json({
        success: true,
        message: "Booking successful",
        booking_code,
        payment_txn_id: txn_id,
        booking: result,
    });
});

trainerBooking.get("/:trainer_id/unavailability/:service_id", async (ctx) => {
    const { trainer_id, service_id } = ctx.req?.params;

    if (!trainer_id || !service_id) {
        return ctx.status(400).json({ success: false, message: "Trainer ID required" });
    }

    let where = `trainer_id = ${sanitize(trainer_id)} AND status IN ('accepted','confirmed') AND service_id = ${sanitize(service_id)} AND requested_end >= NOW()`;

    let sql = find(TABLES.TRAINERS.BOOKING_REQUESTS, {
        columns: `
      requested_start,
      requested_end,
      duration_minutes
    `,
        where,
    });
    function getDatesBetween(start: Date, end: Date) {
        const dates = [];
        let current = new Date(start);

        while (current <= end) {
            dates.push(mysql_date(current));
            current.setDate(current.getDate() + 1);
        }
        return dates;
    }
    const { success, result } = await dbQuery(sql);
    const flatDates = (result || []).flatMap((row) => {
        const startDate = new Date(`${row.requested_start}`);
        const endDate = new Date(row?.requested_end);
        return getDatesBetween(startDate, endDate);
    });
    return ctx.json({
        success,
        result: [...new Set(flatDates)], // remove duplicate dates
    });
});

export default trainerBooking;
