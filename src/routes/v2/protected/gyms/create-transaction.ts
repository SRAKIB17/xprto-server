import { destroy, find, insert, sanitize } from "@tezx/sqlx/mysql";
import { Router } from "tezx";
import paginationHandler from "tezx/middleware/pagination.js";
import { dbQuery, TABLES } from "../../../../models/index.js";

const createTransaction = new Router({
    basePath: '/create-transaction'
});

createTransaction.get("/history", paginationHandler({
    getDataSource: async (ctx, { page, limit, offset }) => {
        const { user_id, } = ctx.auth?.user_info || {};
        let condition = `tr.gym_id = ${user_id}`;
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
            `,
            columns: `tr.*, t.fullname as trainer_fullname, t.avatar as trainer_avatar, c.fullname as client_fullname, c.avatar as client_avatar, w.user_role`,
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
            amount,
            user_id,
            user_role, // trainer, client
            fee = 0,
            currency = "INR",
            idempotency_key = null,
            payment_method,
            external_txn_id,
            reference_type,
            reference_id,
            payment_id,
            note,
        } = body;

        if (!amount || !user_id || !user_role) {
            return ctx.status(400).json({
                success: false,
                message: "Missing required fields: type, amount, user_id, user_role",
            });
        }

        const walletQuery = find(TABLES.WALLETS.WALLETS, {
            where: `user_id = ${sanitize(user_id)} AND user_role = ${sanitize(user_role)}`
        });

        const walletData = await dbQuery(walletQuery);

        if (!walletData.success || walletData?.result?.length === 0) {
            return ctx.status(404).json({
                success: false,
                message: "Gym wallet not found",
            });
        }
        const wallet: any = walletData?.result?.[0];
        const oldBalance = Number(wallet.available_balance || 0);
        const oldHold = Number(wallet.held_balance || 0);
        const payload = {
            wallet_id: wallet.wallet_id,
            gym_id: gym_id,
            admin_id: undefined,
            idempotency_key,
            type: 'payment',
            amount,
            fee,
            currency,
            balance_after: oldBalance,
            hold_change: oldHold,
            payment_method,
            external_txn_id,
            reference_type,
            reference_id,
            payment_id,
            status: "success",
            initiated_by: gym_id,
            initiated_role: "gym",
            note,
        };

        const { success, result, error } = await dbQuery<any>(
            insert(TABLES.WALLETS.transactions, payload)
        );

        if (!success) {
            return ctx.status(500).json({
                success: false,
                message: error || "Transaction failed",
            });
        }

        return ctx.json({
            success: true,
            message: "Transaction created successfully",
            data: {
                txn_id: result.insertId,
                ...payload,
            },
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

        // ---------------------------------------------------
        // 1️⃣ Fetch the transaction (must belong to gym)
        // ---------------------------------------------------
        const fetchQuery = `
            SELECT * FROM ${TABLES.WALLETS.transactions}
            WHERE txn_id = ${id} AND gym_id = ${user_id}
            LIMIT 1
        `;

        const { result, success: fetchSuccess } = await dbQuery<any>(fetchQuery);

        if (!fetchSuccess || result?.length === 0) {
            return ctx.status(404).json({
                success: false,
                message: "Transaction not found or unauthorized",
            });
        }
        // ---------------------------------------------------
        // 3️⃣ Delete it
        // ---------------------------------------------------
        const { success, error } = await dbQuery(
            destroy(TABLES.WALLETS.transactions, {
                where: `txn_id = ${id} AND gym_id = ${user_id}`,
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