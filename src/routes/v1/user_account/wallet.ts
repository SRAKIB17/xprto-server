import { find, insert, mysql_date, sanitize } from "@tezx/sqlx/mysql";
import { Router } from "tezx";
import { generateUUID } from "tezx/helper";
import { paginationHandler } from "tezx/middleware";
import { dbQuery, TABLES } from "../../../models/index.js";
import { performWalletTransaction } from "../../../utils/createWalletTransaction.js";
import { generateTxnID } from "../../../utils/generateTxnID.js";
import { AppNotificationToast } from "../../websocket/notification.js";
import { sendNotification } from "../../../utils/sendNotification.js";

const my_wallet = new Router({
    basePath: "my-wallet"
});

//! docs done
my_wallet.get("/", async (ctx) => {
    const { user_id, email } = ctx.auth?.user_info || {};
    const { role } = ctx.auth || {};

    if (!user_id || !role) {
        return ctx.status(401).json({ message: "Unauthorized" });
    }

    // Try to find existing wallet
    const { result: wallet } = await dbQuery(
        find(TABLES.WALLETS.WALLETS, {
            where: `user_id = ${user_id} AND user_role = '${role}'`,
            limitSkip: { limit: 1 },
        })
    );

    let walletData: any = wallet?.[0];

    // Create new wallet if not exists
    if (!walletData) {
        const { result, success, error } = await dbQuery<any>(
            insert(TABLES.WALLETS.WALLETS, {
                user_role: role,
                user_id,
            })
        );

        if (!success) {
            AppNotificationToast(ctx, {
                message: "Failed to create wallet",
                title: "Create Wallet",
                type: "error",
            });
            return ctx.status(500).json({ message: "Failed to create wallet" });
        }

        const { result: newWallet } = await dbQuery(
            find(TABLES.WALLETS.WALLETS, {
                where: `wallet_id = ${result.insertId}`,
                limitSkip: { limit: 1 },
            })
        );
        walletData = newWallet?.[0];
    }

    // Fetch recent transactions (limit to last 5)
    const { result: recentTransactions } = await dbQuery(
        find(TABLES.WALLETS.transactions, {
            where: `wallet_id = ${walletData.wallet_id}`,
            sort: "created_at DESC",
            limitSkip: { limit: 8 },
        })
    );

    return ctx.json({
        wallet: walletData,
        transactions: recentTransactions || [],
    });
});

//! docs done
my_wallet.get("/transition-history", paginationHandler({
    getDataSource: async (ctx, { page, limit, offset }) => {

        const { role } = ctx.auth || {};
        const { user_id, username, hashed, salt, email } = ctx.auth?.user_info || {};
        let condition = `user_id = ${user_id} AND user_role = '${role}'`;
        const { start, search, end, type } = ctx.req.query;

        if (start) {
            condition += ` AND wallet_transactions.created_at BETWEEN ${sanitize(start)} AND ${sanitize(end ?? mysql_date())} `
        }
        if (search) {
            condition += ` AND (wallet_transactions.idempotency_key = ${sanitize(search)} OR wallet_transactions.external_txn_id = ${sanitize(search)})`
        }
        if (type === 'in') {
            condition += ` AND wallet_transactions.amount > 0`
        }
        if (type === 'out') {
            condition += ` AND wallet_transactions.amount < 0`
        }
        // find(TABLES.WALLETS.WALLETS, {
        //     where: `user_id = ${user_id} AND user_role = '${role}'`,
        //     limitSkip: { limit: 1 },
        // })

        let sql = find(TABLES.WALLETS.transactions, {
            joins: [
                {
                    type: "LEFT JOIN",
                    table: TABLES.WALLETS.WALLETS,
                    on: 'wallet_transactions.wallet_id = wallets.wallet_id',
                }
            ],
            columns: "wallet_transactions.*",
            sort: {
                txn_id: -1
            },
            limitSkip: {
                limit: limit,
                skip: offset
            },
            where: condition,
        })
        let count = find(TABLES.WALLETS.transactions, {
            joins: [
                {
                    type: "LEFT JOIN",
                    table: TABLES.WALLETS.WALLETS,
                    on: 'wallet_transactions.wallet_id = wallets.wallet_id',
                }
            ],
            columns: 'count(*) as count',
            where: condition,
        })
        const { success, result, error } = await dbQuery<any[]>(`${sql}${count}`);
        console.log(error)
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

//! docs done
my_wallet.post('/withdraw', async (ctx) => {
    try {
        const body = await ctx.req.json();
        let {
            withdraw: {
                fee = 0,
                upi,
                amount,
                wallet_id,
                payout_type = 'upi',
                provider = 'razorpay',
                payout_method = 'razorpayx',
                account_holder_name
            },
            prefill
        } = body;


        const role = ctx?.auth?.role;
        const user_id = ctx?.auth?.user_info?.user_id;

        if (!user_id || !role) {
            return ctx.status(401).json({ success: false, message: "Unauthorized" });
        }

        // ✅ Validate amount and UPI
        if (!amount || amount <= 0) {
            return ctx.json({ success: false, message: "Invalid withdrawal amount" });
        }
        if (payout_type === "upi" && (!upi || !/^[\w.\-_]{2,}@[a-zA-Z]{2,}$/.test(upi))) {
            return ctx.json({ success: false, message: "Invalid UPI ID format" });
        }

        // ✅ Generate IDs
        let idempotency_key = generateUUID();
        let txn_id = generateTxnID("WTDRW");

        // ✅ Insert payout request
        const { success: insertSuccess, result, error } = await dbQuery<any>(insert(TABLES.WALLETS.WALLET_PAYOUTS, {
            wallet_id,
            payout_type,
            provider,
            payout_method,
            upi_id: upi,
            account_holder_name,
            idempotency_key,
            external_txn_id: txn_id,
            amount,
            fee,
            status: 'requested'
        }));


        if (!insertSuccess) {
            AppNotificationToast(ctx, {
                title: "Withdraw Failed",
                message: "Unable to request withdrawal. Please try again later.",
                type: "error"
            });
            return ctx.json({ success: false, message: "Failed to create payout request" });
        }

        // ✅ Hold wallet balance for withdrawal
        await performWalletTransaction(
            { role, user_id },
            {
                amount: amount,
                type: 'hold',
                payment_method: payout_method,
                external_txn_id: txn_id,
                idempotency_key: idempotency_key,
                note: "Withdrawal request initiated",
                fee,
                reference_type: "withdraw",
                reference_id: result.insertId
            }
        );

        await sendNotification(
            {
                recipientId: user_id,
                recipientType: role,
                senderType: 'system',
                title: `Withdrawal Request Submitted`,
                message: `Your withdrawal request of ₹${amount} has been received. Our team will process it shortly.`,
                type: 'alert',
                action_url: `/account/wallet/transactions`,
                priority: 'high',
                metadata: {
                    amount,
                    payoutId: result?.insertId,
                    method: payout_method,
                    txnId: txn_id,
                    payoutType: payout_type,
                    event: 'withdraw_request',
                },
            },
            'all'
        );
        // ✅ Send success toast
        AppNotificationToast(ctx, {
            title: "Withdrawal Requested",
            message: `₹${amount} withdrawal request received successfully.`,
            type: "success"
        });

        return ctx.json({
            success: true,
            message: "Withdrawal request submitted successfully",
            txn_id,
            payout_id: result.insertId,
        });

    } catch (error) {
        AppNotificationToast(ctx, {
            title: "Error",
            message: "Something went wrong while processing withdrawal",
            type: "error"
        });
        return ctx.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
});
//! docs done
my_wallet.get("/payout-history", paginationHandler({
    getDataSource: async (ctx, { page, limit, offset }) => {

        const { role } = ctx.auth || {};
        const { user_id, username, hashed, salt, email } = ctx.auth?.user_info || {};
        let condition = `wallets.user_id = ${user_id} AND wallets.user_role = '${role}'`;
        const { start, search, end, type } = ctx.req.query;

        if (start) {
            condition += ` AND wallet_payouts.created_at BETWEEN ${sanitize(start)} AND ${sanitize(end ?? mysql_date())} `
        }
        // if (search) {
        //     condition += ` AND (wallet_transactions.idempotency_key = ${sanitize(search)} OR wallet_transactions.external_txn_id = ${sanitize(search)})`
        // }
        // if (type === 'in') {
        //     condition += ` AND wallet_transactions.amount > 0`
        // }
        // if (type === 'out') {
        //     condition += ` AND wallet_transactions.amount < 0`
        // }
        // find(TABLES.WALLETS.WALLETS, {
        //     where: `user_id = ${user_id} AND user_role = '${role}'`,
        //     limitSkip: { limit: 1 },
        // })

        let sql = find(TABLES.WALLETS.WALLET_PAYOUTS, {
            joins: [
                {
                    type: "LEFT JOIN",
                    table: TABLES.WALLETS.WALLETS,
                    on: 'wallet_payouts.wallet_id = wallets.wallet_id',
                }
            ],
            columns: "wallet_payouts.*",
            sort: {
                created_at: -1
            },
            limitSkip: {
                limit: limit,
                skip: offset
            },
            where: condition,
        })
        let count = find(TABLES.WALLETS.WALLET_PAYOUTS, {
            joins: [
                {
                    type: "LEFT JOIN",
                    table: TABLES.WALLETS.WALLETS,
                    on: 'wallet_payouts.wallet_id = wallets.wallet_id',
                }
            ],
            columns: 'count(*) as count',
            where: condition,
        })
        const { success, result, error } = await dbQuery<any[]>(`${sql}${count}`);
        console.log(result)
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

export default my_wallet;