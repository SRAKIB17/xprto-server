import { find, insert, mysql_date, mysql_datetime, sanitize, update } from "@tezx/sqlx/mysql";
import { Router } from "tezx";
import { paginationHandler } from "tezx/middleware";
import { dbQuery, TABLES } from "../../../../models/index.js";
import { performWalletTransaction } from "../../../../utils/createWalletTransaction.js";
import { generateTxnID } from "../../../../utils/generateTxnID.js";
import { adminWallet } from "../../../../config.js";
import { sendNotification } from "../../../../utils/sendNotification.js";

// import user_account_document_flag from "./flag-document.js";
const trainerBookingRequest = new Router({
    basePath: '/my-bookings'
});

trainerBookingRequest.get("/",
    paginationHandler({
        getDataSource: async (ctx, { page, limit, offset }) => {
            const { role } = ctx.auth || {};
            const { rating, sort, status, date } = ctx?.req.query;

            const { user_id, username, hashed, salt, email } = ctx.auth?.user_info || {};
            let condition = role === 'client' ? `br.client_id = "${user_id}"` : `br.trainer_id = "${user_id}"`
            if (rating) {
                condition += ` AND rating BETWEEN ${rating} AND 5`
            }
            if (status) {
                condition += ` AND br.status = ${sanitize(status)}`
            }
            if (date) {
                const sanitizedDate = sanitize(mysql_date(date as string));
                condition += ` AND (DATE(br.requested_start) <= ${sanitizedDate} AND DATE(br.requested_end) >= ${sanitizedDate})`;
            }
            let sortObj: any = {
                "br.booking_id": -1
            };

            // if (sort === 'highest' || sort === 'lowest') {
            //     sortObj = {
            //         rating: sort === 'highest' ? -1 : 1
            //     }
            // }

            let sql = find(`${TABLES.TRAINERS.BOOKING_REQUESTS} as br`, {
                sort: sortObj,
                joins: `
                LEFT JOIN ${TABLES.TRAINERS.services} as sv ON sv.service_id = br.service_id
                ${role === 'trainer' ?
                        `LEFT JOIN ${TABLES.CLIENTS.clients} as c ON c.client_id = br.client_id`
                        : `LEFT JOIN ${TABLES.TRAINERS.trainers} as t ON t.trainer_id = br.trainer_id`
                    }
                `,
                columns: role === 'trainer' ?
                    `br.*,sv.package_name, sv.title, sv.images, c.fullname,c.avatar,c.bio,c.gender,c.health_goal` :
                    `br.*,sv.package_name, sv.title, sv.images, t.fullname,t.avatar,t.bio,t.gender,t.badge,t.verified,t.specialization`,
                limitSkip: {
                    limit: limit,
                    skip: offset
                },
                where: condition,
            });
            let count = find(`${TABLES.TRAINERS.BOOKING_REQUESTS} as br`, {
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
trainerBookingRequest.get("/:booking_id", async (ctx) => {
    const { role } = ctx.auth || {};

    const { user_id, username, hashed, salt, email } = ctx.auth?.user_info || {};
    let condition = role === 'client' ? `br.client_id = "${user_id}"` : `br.trainer_id = "${user_id}"`

    let sql = find(`${TABLES.TRAINERS.BOOKING_REQUESTS} as br`, {
        joins: `
                LEFT JOIN ${TABLES.TRAINERS.services} as sv ON sv.service_id = br.service_id
                ${role === 'trainer' ?
                `LEFT JOIN ${TABLES.CLIENTS.clients} as c ON c.client_id = br.client_id`
                : `LEFT JOIN ${TABLES.TRAINERS.trainers} as t ON t.trainer_id = br.trainer_id`
            }
                `,
        columns: role === 'trainer' ?
            `br.*,sv.package_name, sv.title, sv.images, c.fullname,c.avatar,c.bio,c.gender,c.health_goal` :
            `br.*,sv.package_name, sv.title, sv.images, t.fullname,t.avatar,t.bio,t.gender,t.badge,t.verified,t.specialization`,
        where: `${condition} AND booking_id = ${sanitize(ctx.req.params.booking_id)}`,
    });

    const { success, result, error } = await dbQuery<any[]>(`${sql}`);

    return ctx.json({
        data: result?.[0],
        success: true,
    })
},
);

trainerBookingRequest.post("/change-status/:status", async (ctx) => {
    try {
        const status = (ctx.req.params.status || "").toLowerCase();
        const allowedStatuses = ["pending", "accepted", "rejected", "cancelled", "completed", "rescheduled"];

        if (!allowedStatuses.includes(status)) {
            return ctx.status(400).json({ success: false, message: "Invalid status value" });
        }

        const { role } = ctx.auth || {};
        const { user_id } = ctx.auth?.user_info || {};

        const { booking, status_reason, note, meet_link, total_days, calculate_refund } = await ctx.req.json<any>();
        const id = booking?.booking_id;


        if (!id) {
            return ctx.status(400).json({ success: false, message: "Booking ID missing" });
        }

        // ✅ Payload for update
        const payload: any = {
            meet_link: booking?.delivery_mode === "online" ? meet_link : undefined,
            [role === "client" ? "client_note" : "trainer_note"]: note,
            status_reason: status === "rejected" ? status_reason : undefined,
            status
        };


        // ⚠️ Only client can cancel/reschedule
        if (role === "client" && !['completed', "cancelled", "rescheduled"].includes(status)) {
            return ctx.status(403).json({
                success: false,
                message: "Clients can only cancel or reschedule a booking"
            });
        }

        // ⚠️ Trainer updating
        if (role === "trainer" && ["cancelled", "rescheduled", "completed"].includes(status)) {
            return ctx.status(403).json({
                success: false,
                message: "Only clients can cancel or reschedule or completed bookings"
            });
        }

        if (status === "completed" || status === 'cancelled') {
            // await releaseBookingPayment(id, user_id); // ⚡ your wallet handler here
            let final_price = Number(booking?.final_price);
            let idempotency_key = booking?.idempotency_key;
            let txn_id = booking?.txn_id;
            const { amount } = await performWalletTransaction(
                { role, user_id },
                {
                    amount: final_price,
                    type: "hold",
                    payment_method: "wallet",
                    external_txn_id: txn_id,
                    idempotency_key,
                }
            );
            let transferAmount = Math.abs(Number(amount));
            if (status === 'completed') {
                let { success: clientSuccess } = await performWalletTransaction(
                    { role, user_id },
                    {
                        amount: transferAmount,
                        type: "hold-transfer",
                        note: "Completed session and transfer balance",
                        payment_method: "wallet",
                        reference_id: `idempotency-${idempotency_key}`,
                        reference_type: "completed session",
                        external_txn_id: generateTxnID("CMPLTD_SSSN"),
                    }
                );
                if (!clientSuccess) {
                    return ctx.json({
                        success: false,
                        message: "Releasing the payment failed. Please try again or contact support.",
                    });
                }
                let { success } = await performWalletTransaction(
                    { role: 'trainer', user_id: booking?.trainer_id },
                    {
                        amount: transferAmount,
                        type: "transfer_in",
                        note: "Completed session and transfer in balance",
                        payment_method: "wallet",
                        reference_id: `idempotency-${idempotency_key}`,
                        reference_type: "completed session",
                        external_txn_id: generateTxnID("CMPLTD_SSSN"),
                    }
                );
                if (!success) {
                    return ctx.json({
                        success: false,
                        message: "Payment release to the trainer failed. The session is marked as completed, but the trainer did not receive the balance. Please try again or contact support.",
                    });
                }
            }
            else if (status === 'cancelled') {
                let { charge_amount, refund_amount } = calculate_refund;
                let xprto = total_days === 1 ? (charge_amount * 10) / 100 : charge_amount / 2;
                let trainer = total_days === 1 ? (charge_amount * 90) / 100 : charge_amount / 2;

                // 1) Refund unused balance to client
                let { success: clientSuccess } = await performWalletTransaction(
                    { role, user_id },
                    {
                        amount: refund_amount,
                        type: "release_hold",
                        note: "Session cancelled: Unused balance refunded to client",
                        payment_method: "wallet",
                        reference_id: `idempotency-${idempotency_key}`,
                        reference_type: "client_cancel_refund",
                        external_txn_id: generateTxnID("CNCL_REFUND"),
                    }
                );
                // 2) Deduct charge for used days
                let { success: ChargeHold } = await performWalletTransaction(
                    { role, user_id },
                    {
                        amount: charge_amount,
                        type: "hold-transfer",
                        note: "Session cancelled: Charge deducted for used session days",
                        payment_method: "wallet",
                        reference_id: `idempotency-${idempotency_key}`,
                        reference_type: "cancel_session_charge",
                        external_txn_id: generateTxnID("CNCL_CHARGE"),
                    }
                );
                if (!clientSuccess && !ChargeHold) {
                    return ctx.json({
                        success: false,
                        message: "Releasing the payment failed. Please try again or contact support.",
                    });
                }
                // send to trainer 
                let { success } = await performWalletTransaction(
                    { role: "trainer", user_id: booking?.trainer_id },
                    {
                        amount: trainer,
                        type: "transfer_in",
                        note: `Client cancelled: Trainer earned ${trainer} INR`,
                        payment_method: "wallet",
                        reference_id: `idempotency-${idempotency_key}`,
                        reference_type: "trainer_cancel_payout",
                        external_txn_id: generateTxnID("CLIENT_CANCEL"),
                    }
                );

                await performWalletTransaction(
                    { role: "admin", user_id: adminWallet.admin_id },
                    {
                        amount: xprto,
                        type: "transfer_in",
                        note: `Client cancelled: XPRTO commission ${xprto} INR`,
                        payment_method: "wallet",
                        reference_id: `idempotency-${idempotency_key}`,
                        reference_type: "admin_cancel_commission",
                        external_txn_id: generateTxnID("ADMIN_CANCEL"),
                    }
                );
                if (!success) {
                    return ctx.json({
                        success: false,
                        message: "Payment release to the trainer failed. The session is marked as completed, but the trainer did not receive the balance. Please try again or contact support.",
                    });
                }
            }
        }
        // ✅ Update DB
        const { success, error } = await dbQuery(
            update(TABLES.TRAINERS.BOOKING_REQUESTS, {
                values: payload,
                where: `booking_id = ${id} AND ${role === "client" ? "client_id" : "trainer_id"} = ${user_id}`,
            })
        );
        if (!success) {
            return ctx.status(500).json({ success: false, message: "Failed to update booking status" });
        }

        // ✅ Extra: On completed → release payment
        const notifyTarget =
            role === "client" ? booking?.trainer_id : booking?.client_id;

        const notifyTargetRole =
            role === "client" ? "trainer" : "client";

        const senderRole =
            role === "client" ? "client" : "trainer";

        const statusTitleMap: Record<string, string> = {
            pending: "Pending Request Update",
            accepted: "Booking Accepted",
            rejected: "Booking Rejected",
            cancelled: "Booking Cancelled",
            completed: "Session Completed",
            rescheduled: "Booking Rescheduled"
        };

        const statusMessageMap = {
            pending: `${booking?.fullname} updated the booking request.`,
            accepted: `Your booking with ${booking?.fullname} has been accepted.`,
            rejected: `Your booking was rejected. Reason: ${status_reason || "N/A"}.`,
            cancelled: `${booking?.fullname} has cancelled the booking.`,
            completed: `The session has been successfully completed.`,
            rescheduled: `${booking?.fullname} has rescheduled the booking.`,
        };

        // 🎯 Send Notification
        await sendNotification(
            {
                recipientId: notifyTarget,
                recipientType: notifyTargetRole,
                senderId: user_id,
                senderType: senderRole,
                title: statusTitleMap[status],
                message: statusMessageMap[status as keyof typeof statusMessageMap],

                type: `alert`,
                priority: "high",

                metadata: {
                    event: "trainer_booking_status_update",
                    status,
                    booking_id: booking?.booking_id,
                    trainer_id: booking?.trainer_id,
                    client_id: booking?.client_id,
                    reason: status_reason || null,
                    meet_link: meet_link || null,
                    note,
                    total_days,
                    calculate_refund,
                    updated_by: senderRole,
                    updated_at: mysql_datetime(),
                }
            },
            "all"
        );

        return ctx.json({
            success: true,
            message: `Booking status updated to ${status}`,
        });

    } catch (err) {
        console.error("Booking status error:", err);
        return ctx.status(500).json({
            success: false,
            message: "Something went wrong",
        });
    }
});

trainerBookingRequest.post("/messaging", async (ctx) => {
    const { status, client_id, trainer_id, fullname } = await ctx.req.json();

    const { role } = ctx.auth || {};
    const { user_id, fullname: my_name } = ctx.auth?.user_info || {};
    if (!['completed', 'accepted']?.includes(status)) {
        return ctx.status(400).json({ success: false, message: "Invalid booking status" });
    }

    // ✅ Step 2: Check existing room
    const check = await dbQuery(find(`${TABLES.CHAT_ROOMS.chat_rooms} as cr`, {
        joins: `
          JOIN ${TABLES.CHAT_ROOMS.memberships} m1 ON cr.room_id = m1.room_id
          JOIN ${TABLES.CHAT_ROOMS.memberships} m2 ON cr.room_id = m2.room_id
        `,
        where: `
          m1.user_id=${client_id} AND m1.user_role='client' 
          AND m2.user_id=${trainer_id} AND m2.user_role='trainer' 
          AND cr.is_group=0
        `
    }));

    if (check?.result?.length) {
        return ctx.json({ success: true, room: check.result[0] });
    }

    // ✅ Step 3: Create room
    const roomName = `${fullname ?? `${role === 'client' ? "TRAINER" : "CLIENT"}-${role === 'client' ? trainer_id : client_id}`} & ${my_name ?? `${role}-${user_id}`}`

    const createRoom = await dbQuery<any>(insert(TABLES.CHAT_ROOMS.chat_rooms, { room_name: roomName }));

    if (!createRoom?.success) {
        return ctx.status(500).json({ success: false, message: "Failed to create room" });
    }
    const room_id = createRoom.result.insertId;
    // ✅ Step 4: Add members
    await dbQuery(insert(TABLES.CHAT_ROOMS.memberships, [
        { room_id, user_id: client_id, user_role: "client" },
        { room_id, user_id: trainer_id, user_role: "trainer" }
    ]));

    return ctx.json({
        success: true,
        room: { room_id, room_name: roomName }
    });
});


export default trainerBookingRequest;