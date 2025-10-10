import { find, sanitize } from "@tezx/sqlx/mysql";
import { Router, TezXError } from "tezx";
import { dbQuery } from "../../../models/index.js";
import { TABLES } from "../../../models/table.js";


// import user_account_document_flag from "./flag-document.js";
const earningDashboardGymTrainer = new Router({
    basePath: '/earning'
});
earningDashboardGymTrainer.get('/dashboard/:wallet_id', async (ctx) => {
    try {
        const wallet_id = ctx.req.params?.wallet_id;
        const { user_id } = ctx.auth?.user_info || {};

        if (!user_id) {
            return ctx.status(401).json({ success: false, message: "Unauthorized" });
        }

        let matrix = find(`${TABLES.WALLETS.WALLETS} as w`, {
            columns: `
  -- Total credited to wallet
  COALESCE(SUM(CASE WHEN wt.type IN ('topup', 'refund', 'transfer_in') AND wt.status = 'success' THEN wt.amount ELSE 0 END), 0) AS total_earnings,

  -- Pending payout requests
  COALESCE(SUM(CASE WHEN wp.status IN ('requested', 'processing') THEN wp.amount ELSE 0 END), 0) AS pending_amount,

  -- Completed payouts
  COALESCE(SUM(CASE  WHEN wp.status = 'completed' THEN wp.amount  ELSE 0 END), 0) AS completed_amount
                `,
            joins: [
                {
                    type: "LEFT JOIN",
                    on: "wt.wallet_id = w.wallet_id",
                    table: `${TABLES.WALLETS.transactions} as wt`
                },
                {
                    type: "LEFT JOIN",
                    on: "wp.wallet_id = w.wallet_id",
                    table: `${TABLES.WALLETS.WALLET_PAYOUTS} as wp`
                },
            ],
            where: `w.wallet_id = ${wallet_id}`
        });
        const { success, result, error } = await dbQuery(matrix);

        if (!success) {
            return ctx.status(500).json({
                metrics: {
                    total_earnings: 0,
                    pending_amount: 0,
                    completed_amount: 0,
                },
                success: false,
                message: "Failed to fetch dashboard metrics", error
            });
        }
        return ctx.json({
            success: true,
            metrics: result?.[0] || {
                total_earnings: 0,
                pending_amount: 0,
                completed_amount: 0,
            }
        });
    } catch {
        return ctx.status(500).json({ success: false, message: "Something went wrong", });
    }
});

earningDashboardGymTrainer.get("/revenue-chart/:wallet_id/:chart", async (ctx) => {
    try {
        const { chart, wallet_id } = ctx.req.params as {
            wallet_id: string;
            chart: "yearly" | "monthly" | "weekly" | "last-30-days";
        };
        const safeWallet = sanitize(wallet_id);
        let condition = `wallet_id = ${safeWallet} AND type IN ('topup', 'refund', 'transfer_in')  AND status = 'success'`;

        let groupBy = "";
        let orderBy = "";
        let columns = '';

        if (chart === 'yearly') {
            columns = `DATE_FORMAT(created_at, '%b') AS label, SUM(amount) AS value`;
            condition += ` AND status = 'success' AND YEAR(created_at) = YEAR(CURDATE())`;
            groupBy = `MONTH(created_at)`;
            orderBy = `MONTH(created_at)`;
        }
        else if (chart === 'monthly') {
            columns = `CONCAT('Week ', WEEK(created_at, 1) - WEEK(DATE_SUB(created_at, INTERVAL DAY(created_at) - 1 DAY), 1) + 1) AS label,  SUM(amount) AS value`;
            condition += ` AND YEAR(created_at) = YEAR(CURDATE()) AND MONTH(created_at) = MONTH(CURDATE())`;
            groupBy = `label`;
            orderBy = `MIN(created_at)`;
        }
        else if (chart === "weekly") {
            columns = `DATE_FORMAT(created_at, '%a') AS label, SUM(amount) AS value`;
            condition += ` AND created_at >= CURDATE() - INTERVAL 7 DAY`;
            groupBy = `DATE(created_at)`;
            orderBy = `DATE(created_at)`;

        } else if (chart === "last-30-days") {
            columns = `DATE_FORMAT(created_at, '%d %b') AS label, SUM(amount) AS value`;
            condition += ` AND created_at >= CURDATE() - INTERVAL 30 DAY`;
            groupBy = `DATE(created_at)`;
            orderBy = `DATE(created_at)`;

        } else {
            throw new TezXError("Invalid chart type", 400);
        }

        const { success, result, error } = await dbQuery(find(TABLES.WALLETS.transactions, {
            columns: columns,
            sort: orderBy,
            groupBy: groupBy,
            where: condition
        }))
        if (!success) throw new TezXError("Database query failed", 500);
        return ctx.json(result || []);
    }
    catch (error: any) {
        return ctx.json({ error: error.message }, { status: error.statusCode });
    }
    // yearly
    //  SELECT
    //   DATE_FORMAT(created_at, '%b') AS label,
    //   SUM(amount) AS value
    // FROM wallet_transactions
    // WHERE wallet_id = 2

    // GROUP BY MONTH(created_at)
    // ORDER BY MONTH(created_at);

    // MONTHLY
    // SELECT
    //     CONCAT('Week ', WEEK(created_at, 1) - WEEK(DATE_SUB(created_at, INTERVAL DAY(created_at) - 1 DAY), 1) + 1) AS label,
    //         SUM(amount) AS value
    // FROM wallet_transactions
    // WHERE wallet_id = ?
    //         AND type IN ('topup', 'refund', 'transfer_in')
    //   AND status = 'success'
    //   AND YEAR(created_at) = YEAR(CURDATE())
    //   AND MONTH(created_at) = MONTH(CURDATE())
    // GROUP BY label
    // ORDER BY MIN(created_at);

    // LAST 30 DAYS
    //     SELECT
    //     DATE_FORMAT(created_at, '%d %b') AS label,
    //         SUM(amount) AS value
    // FROM wallet_transactions
    // WHERE wallet_id = ?
    //         AND type IN ('topup', 'refund', 'transfer_in')
    //   AND status = 'success'
    //   AND created_at >= CURDATE() - INTERVAL 30 DAY
    // GROUP BY DATE(created_at)
    // ORDER BY DATE(created_at);

    // WEEKLY (past 7 days
    //     SELECT
    //     DATE_FORMAT(created_at, '%a') AS label, --Mon, Tue, Wed...
    // SUM(amount) AS value
    // FROM wallet_transactions
    // WHERE wallet_id = ?
    //     AND type IN('topup', 'refund', 'transfer_in')
    //   AND status = 'success'
    //   AND created_at >= CURDATE() - INTERVAL 7 DAY
    // GROUP BY DATE(created_at)
    // ORDER BY DATE(created_at);
});


export default earningDashboardGymTrainer;