import { find, mysql_date, sanitize } from "@tezx/sqlx/mysql";
import { Router } from "tezx";
import { paginationHandler } from "tezx/middleware";
import { dbQuery, TABLES } from "../../../../models/index.js";

const payoutHistory = new Router({
    basePath: "/payout-history"
});
payoutHistory.get('/:role', paginationHandler({
    getDataSource: async (ctx, { page, limit, offset }) => {
        const { role } = ctx.req.params;

        let condition = `w.user_role = '${role}'`;
        // let condition = `wallets.user_id = ${user_id} AND wallets.user_role = '${role}'`;
        const { start, search, end } = ctx.req.query;

        if (search) {
            const s = JSON.stringify(`%${search}%`);
            condition += (` AND 
                (
                    p.external_txn_id LIKE ${s} OR 
                    p.provider_payout_id LIKE ${s} OR
                    p.reference_id LIKE ${s} OR
                    p.idempotency_key LIKE ${s} OR
                    p.external_txn_id LIKE ${s} 
                )
            `);
        }

        let join = '';
        if (role === 'trainer') {
            join = `LEFT JOIN ${TABLES.TRAINERS.trainers} as u ON u.trainer_id = w.user_id `;
        }
        if (role === 'client') {
            join = `LEFT JOIN ${TABLES.CLIENTS.clients} as u ON u.client_id = w.user_id`;
        }
        if (role === 'gym') {
            join = `LEFT JOIN ${TABLES.TRAINERS.trainers} as u ON u.gym_id = w.user_id`;
        }

        if (start) {
            condition += ` AND p.created_at BETWEEN ${sanitize(start)} AND ${sanitize(end ?? mysql_date())} `;
        }

        let sql = find(`${TABLES.WALLETS.WALLET_PAYOUTS} as p`, {
            joins: `RIGHT JOIN ${TABLES.WALLETS.WALLETS} as w ON w.wallet_id = p.wallet_id ${join}`,

            columns: "p.*, u.*",
            sort: {
                created_at: -1
            },
            limitSkip: {
                limit: limit,
                skip: offset
            },
            where: condition,
        });

        let count = find(`${TABLES.WALLETS.WALLET_PAYOUTS} as p`, {
            joins:
                `RIGHT JOIN ${TABLES.WALLETS.WALLETS} as w ON w.wallet_id = p.wallet_id ${join}
                `,
            columns: 'count(*) as count',
            where: condition,
        });

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
}));

payoutHistory.put('/:role/update/:payout_id', async (ctx) => {
    const { payout_id, role } = ctx.req.params;
    const body = await ctx.req.json();

    // Allowed fields
    const allowedFields = [
        "status",
        "failure_reason",
        "provider_payout_id",
        "reference_id",
        "external_txn_id",
        "txn_note",
        "payout_method",
        "provider",
        "amount",
        "fee",
        "tax"
    ];

    let updateData: Record<string, any> = {};

    // Pick only allowed fields
    for (let key of allowedFields) {
        if (body[key] !== undefined) {
            updateData[key] = body[key];
        }
    }

    if (Object.keys(updateData).length === 0) {
        return ctx.json({
            success: false,
            message: "No valid fields to update."
        });
    }

    // Build SQL SET clause
    let setParts = [];
    for (let key in updateData) {
        setParts.push(`${key} = ${sanitize(updateData[key])}`);
    }

    const sql = `
        UPDATE ${TABLES.WALLETS.WALLET_PAYOUTS}
        SET ${setParts.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE payout_id = ${sanitize(payout_id)}
    `;

    const { success, error } = await dbQuery(sql);

    if (!success) {
        return ctx.json({
            success: false,
            message: "Database error",
            error
        });
    }

    return ctx.json({
        success: true,
        message: "Payout updated successfully",
        updated: updateData
    });
});

export default payoutHistory