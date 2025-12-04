import { destroy, find } from "@tezx/sqlx/mysql";
import { Router } from "tezx";
import paginationHandler from "tezx/middleware/pagination.js";
import { dbQuery, TABLES } from "../../../../models/index.js";
import { performWalletTransaction } from "../../../../utils/createWalletTransaction.js";

const createTransaction = new Router({
    basePath: '/create-transaction'
});

createTransaction.get("/history", paginationHandler({
    getDataSource: async (ctx, { page, limit, offset }) => {
        const { user_id, } = ctx.auth?.user_info || {};
        let condition = `tr.admin_id = ${user_id}`;
        const search = ctx.req.query?.search;

        if (search) {
            const s = JSON.stringify(`%${search}%`);
            condition += `
            AND (
                tr.idempotency_key LIKE ${s}
                OR tr.txn_id LIKE  ${s}
                OR tr.external_txn_id LIKE  ${s}
                OR tr.reference_id LIKE  ${s}
            )`;
        }

        let sql = find(`${TABLES.WALLETS.transactions} as tr`, {
            sort: {
                "tr.created_at": -1
            },
            joins: `
            LEFT JOIN ${TABLES.WALLETS.WALLETS} as w ON w.wallet_id = tr.wallet_id
            LEFT JOIN ${TABLES.TRAINERS.trainers} as t ON t.trainer_id = w.user_id AND w.user_role="trainer"
            LEFT JOIN ${TABLES.CLIENTS.clients} as c ON c.client_id = w.user_id AND w.user_role="client"
            LEFT JOIN ${TABLES.GYMS.gyms} as g ON g.gym_id = w.user_id AND w.user_role="gym
            `,
            columns: `tr.*, t.fullname as trainer_fullname, t.avatar as trainer_avatar, c.fullname as client_fullname, c.avatar as client_avatar, g.fullname as gym_fullname, g.avatar as gym_avatar, g.logo_url as gym_logo, g.gym_name, w.user_role`,
            limitSkip: {
                limit: limit,
                skip: offset
            },
            where: condition,
        })
        let count = find(`${TABLES.WALLETS.transactions} as tr`, {
            columns: 'count(*) as count',
            where: condition,
        })
        const { error, success, result } = await dbQuery<any[]>(`${sql}${count}`);

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
}))

createTransaction.post("/", async (ctx) => {
    try {
        const { user_id: gym_id } = ctx.auth?.user_info || {};
        const { role } = ctx.auth ?? {};

        if (!gym_id || role !== "gym") {
            return ctx.status(401).json({
                success: false,
                message: "Unauthorized – only gym can perform wallet transactions",
            });
        }

        const body = await ctx.req.json();

        const {
            type, /**
            'topup', -- add money from external source
            'hold', -- place amount on hold
            'release_hold', -- release held amount
            'payment', -- deduct for services
            'payout', -- withdraw money
            'refund', -- refund to user
            'adjustment', -- admin correction
            'transfer_in', -- incoming transfer
            'transfer_out' -- outgoing transfer
             */
            amount,
            user_id,
            user_role,// trainer, client/'gym'

            fee = 0,
            currency = "INR",
            idempotency_key = null,
            payment_method,
            external_txn_id,
            reference_type,
            reference_id,
            payment_id,
            metadata,
            note,
        } = body;
        // Perform transaction
        if (!type || !amount || !user_id || !user_role) {
            return ctx.status(400).json({
                success: false,
                message: "Missing required fields: type, amount, user_id, user_role",
            });
        }

        const {
            success,
            txn_id,
            error
        } = await performWalletTransaction(
            {
                role: user_role,
                user_id: user_id
            },
            {
                fee,
                currency,
                amount,
                type,
                admin_id: gym_id,        // correct admin id
                initiated_role: "gym",   // correct role
                idempotency_key,
                payment_method,
                external_txn_id,
                reference_type,
                reference_id,
                payment_id,
                metadata,
                note,
            }
        );

        if (!success) {
            return ctx.status(400).json({
                success: false,
                message: "Transaction failed",
                error,
            });
        }

        return ctx.json({
            success: true,
            message: "Transaction created successfully",
            data: { txn_id },
        });

    } catch (err: any) {
        return ctx.status(500).json({
            success: false,
            message: "Server error",
            error: err.message,
        });
    }
});

createTransaction.delete("/:txn_id", async (ctx) => {
    try {
        const { user_id } = ctx.auth?.user_info || {};
        const { role } = ctx.auth ?? {};
        const { txn_id } = ctx.req.params;

        if (!user_id || role !== "gym") {
            return ctx.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        // Ensure numeric
        const id = Number(txn_id);
        if (isNaN(id)) {
            return ctx.status(400).json({
                success: false,
                message: "Invalid transaction id",
            });
        }

        const { success, error } = await dbQuery(
            destroy(TABLES.WALLETS.transactions, {
                where: `txn_id = ${id}`,
            })
        );

        if (!success) {
            return ctx.status(500).json({
                success: false,
                message: "Failed to delete transaction",
                error,
            });
        }

        return ctx.json({
            success: true,
            message: "Transaction deleted successfully",
        });

    } catch (err: any) {
        return ctx.status(500).json({
            success: false,
            message: "Server error",
            error: err.message,
        });
    }
});

export default createTransaction;