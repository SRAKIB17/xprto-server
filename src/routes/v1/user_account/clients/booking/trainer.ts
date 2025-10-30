import { find, sanitize } from "@tezx/sqlx/mysql";
import { Router } from "tezx";
import { dbQuery, TABLES } from "../../../../../models/index.js";
import { generateUUID } from "tezx/helper";
import { generateTxnID } from "../../../../../utils/generateTxnID.js";


// import user_account_document_flag from "./flag-document.js";
const trainerBooking = new Router({
    basePath: '/trainers'
});
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
        return ctx.status(401).json({ message: "Unauthorized" });
    }

    let { payment_status, slot, client_note, range, select, location } = await ctx.req.json();
    let {
        service_id, trainer_id, title, description, details, package_name, package_features, price, discount, currency, duration_minutes, delivery_mode, requirements, video, images, faqs, status, verify_status, created_at, updated_at, attachments, per_unit, recurrence_type, recurrence_days, time_from, fullname, avatar, active_red_flags_count
    } = select;
    const { end, start } = range;
    let booking_code = generateTxnID("BK");
    let txn_id = generateTxnID("KYC");
    console.log(slot)
    let idempotency_key = generateUUID();
    const discountAmount = (Number(price) * Number(discount || 0)) / 100;
    const finalPrice = Number(price) - discountAmount;

    //         requested_start DATETIME NULL,
    //         requested_end DATETIME NULL,
    //         -- scheduled times (what trainer accepted / admin scheduled)
    //         scheduled_start DATETIME NULL,
    //         scheduled_end DATETIME NULL,
    //         duration_minutes INT NULL,
    //         -- meeting / delivery details
    //         delivery_mode ENUM ('online', 'doorstep', 'hybrid') NOT NULL DEFAULT 'online',
    //         location TEXT NULL, -- user provided address (if applicable)
    //         meet_link VARCHAR(1000) NULL, -- zoom/meet link or similar
    //         -- notes
    //         client_note TEXT NULL, -- note from client while requesting
    //         trainer_note TEXT NULL, -- trainer can add private/public notes
    //         admin_note TEXT NULL, -- optional admin note
    //         -- status & flow
    //         status ENUM (
    //             'pending',
    //             'accepted',
    //             'confirmed',
    //             'rejected',
    //             'cancelled',
    //             'rescheduled',
    //             'completed'
    //         ) NOT NULL DEFAULT 'pending',
    //         status_reason VARCHAR(255) NULL, -- short reason/reject note
    //         cancelled_by ENUM ('client', 'trainer', 'admin') NULL,
    //         -- payment
    //         payment_status ENUM (
    //             'unpaid',
    //             'initiated',
    //             'paid',
    //             'refunded',
    //             'failed'
    //         ) DEFAULT 'unpaid',
    //         payment_txn_id VARCHAR(100) NULL,
    //         idempotency_key VARCHAR(191) DEFAULT NULL, -- ensure idempotent ops,
    //         -- meta
    //         created_by BIGINT UNSIGNED NULL,
    //         created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    //         updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    //         responded_at DATETIME NULL, -- when trainer accepted/rejected
    //         responded_by BIGINT UNSIGNED NULL, -- trainer/admin id who responded
    //         PRIMARY KEY (booking_id),
    //         INDEX idx_trainer_status (trainer_id, status, created_at),
    //         INDEX idx_client (client_id, created_at),
    //         INDEX idx_service (service_id),
    //         INDEX idx_booking_code (booking_code),
    //         CONSTRAINT fk_br_client FOREIGN KEY (client_id) REFERENCES users (user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    //         CONSTRAINT fk_br_trainer FOREIGN KEY (trainer_id) REFERENCES trainers (trainer_id) ON DELETE CASCADE ON UPDATE CASCADE
    let payload = {
        wallet_used: true,
        client_id: user_id,
        trainer_id,
        requested_start: "",
        requested_end: '',
        price,
        discount_percent: discount,
        service_id,
        per_unit,
    }

    return ctx.json({})
})

export default trainerBooking;