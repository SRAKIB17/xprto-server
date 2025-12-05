import { find, insert, mysql_datetime, sanitize } from "@tezx/sqlx/mysql";
import { Router } from "tezx";
import { generateUUID } from "tezx/helper";
import { dbQuery, TABLES } from "../../../../models/index.js";
import { performWalletTransaction } from "../../../../utils/createWalletTransaction.js";
import { generateTxnID } from "../../../../utils/generateTxnID.js";
import { sendNotification } from "../../../../utils/sendNotification.js";

const clientMembership = new Router({
    basePath: "/membership"
});

clientMembership.get('/', async (ctx) => {
    const auth = ctx.auth ?? {};
    const { user_id } = ctx.auth?.user_info || {};

    const sql = find(`${TABLES.CLIENTS.CLIENT_GYM_MEMBERSHIPS} as cgm`, {
        joins: `
            LEFT JOIN ${TABLES.GYMS.PLANS} as pl ON pl.plan_id = cgm.plan_id
            LEFT JOIN ${TABLES.GYMS.gyms} as gm  ON gm.gym_id = cgm.gym_id
        `,
        sort: {
            is_active: -1
        },
        columns: `
            cgm.*,
            pl.*,
            gm.gym_name,
            gm.logo_url,

            CASE
                WHEN cgm.valid_to >= CURRENT_DATE()
                    THEN 1
                ELSE 0
            END AS is_active,

            CASE
                WHEN cgm.valid_to < CURRENT_DATE()
                    THEN 'Your membership has expired. Please visit the gym to renew it.'
                ELSE NULL
            END AS renewal_message
        `,
        where: `cgm.client_id = ${sanitize(user_id)}`
    });

    return ctx.json(await dbQuery(sql));
});

function calculateValidTo(billing_cycle: string) {
    const now = new Date();

    switch (billing_cycle) {
        case "daily":
            now.setDate(now.getDate() + 1);
            break;

        case "weekly":
            now.setDate(now.getDate() + 7);
            break;

        case "monthly":
            now.setMonth(now.getMonth() + 1);
            break;

        case "quarterly": // 3 months
            now.setMonth(now.getMonth() + 3);
            break;

        case "half_yearly": // 6 months
            now.setMonth(now.getMonth() + 6);
            break;

        case "yearly":
            now.setFullYear(now.getFullYear() + 1);
            break;

        case "one_time":
            // one-time purchase → no expiry
            return null;

        default:
            // fallback: monthly  
            now.setMonth(now.getMonth() + 1);
            break;
    }
    return now;
}

clientMembership.post('/booking', async (ctx) => {
    try {
        const body = await ctx.req.json();
        const { user_id, fullname } = ctx.auth?.user_info || {};

        if (!user_id) {
            return ctx.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        const {
            plan_id,
            gym_id,
            title,
            price,
            discount_percent,
            currency = "INR",
            billing_cycle,
            duration_days
        } = body;

        const txn_id = generateTxnID("MEMBERSHIP");
        const idempotency_key = generateUUID();

        // -----------------------------
        // 💰 Price Calculation
        // -----------------------------
        const originalPrice = Number(price);
        const discountPercent = Number(discount_percent || 0);

        const actualPrice =
            discountPercent > 0
                ? originalPrice - (originalPrice * discountPercent) / 100
                : originalPrice;

        // -----------------------------
        // 💸 Wallet Debit
        // -----------------------------
        const { success: debitSuccess, error: debitError } =
            await performWalletTransaction(
                { role: "client", user_id },
                {
                    amount: actualPrice,
                    type: "payment",
                    payment_method: "wallet",
                    external_txn_id: txn_id,
                    idempotency_key,
                    note: `Membership payment | GymID(${gym_id})`,
                    reference_type: "gym_membership",
                    reference_id: plan_id,
                }
            );

        if (!debitSuccess) {
            return ctx.status(400).json({
                success: false,
                message: debitError || "Insufficient balance or payment failed",
            });
        }

        // -----------------------------
        // 📅 Validity Calculation
        // -----------------------------
        const validToDate = calculateValidTo(billing_cycle);
        const payload = {
            client_id: user_id,
            gym_id,
            plan_id,
            txn_id,
            price: originalPrice,
            discount_percent: discountPercent,
            reference: idempotency_key,
            valid_from: mysql_datetime(),  // NOW()
            valid_to: validToDate ? mysql_datetime(validToDate) : undefined,
        };

        // -----------------------------
        // 📥 Save Membership Enrollment
        // -----------------------------
        const { success, result, error } = await dbQuery<any>(insert(TABLES.CLIENTS.CLIENT_GYM_MEMBERSHIPS, payload));

        if (!success) {
            if (error?.errno === 1062) {
                return ctx.json({
                    success: false,
                    message: "You are already subscribed",
                });
            }
            return ctx.status(500).json({
                success: false,
                message: "Membership creation failed",
                error,
            });
        }

        // -----------------------------
        // 🔔 Notification to Gym
        // -----------------------------
        await sendNotification(
            {
                recipientId: gym_id,
                recipientType: "gym",
                senderType: "client",
                senderId: user_id,

                title: `New Membership Subscription`,
                message: `${fullname} subscribed to your plan "${title}" for ${actualPrice} ${currency}.`,
                type: "alert",
                priority: "high",
                action_url: `/gym/subscriptions`,

                metadata: {
                    event: "membership_subscription",
                    client_id: user_id,
                    client_name: fullname,
                    plan_id,
                    plan_title: title,
                    billing_cycle,
                    duration_days,
                    original_price: originalPrice,
                    discount_percent: discountPercent,
                    final_price: actualPrice,
                    txn_id,
                    currency,
                },
            },
            "all"
        );

        return ctx.json({
            success: true,
            message: "Membership booked successfully",
            membership_id: result?.insertId,
        });

    } catch (err: any) {
        return ctx.status(500).json({
            success: false,
            message: "Internal server error",
            error: err.message || err,
        });
    }
});


export default clientMembership;
