import { find, sanitize } from "@tezx/sqlx/mysql";
import { Router } from "tezx";
import { paginationHandler } from "tezx/middleware";
import { dbQuery, TABLES } from "../../../../models";

const adminAbuseReport = new Router();

adminAbuseReport.get(
    "/:role",
    paginationHandler({
        getDataSource: async (ctx, { page, limit, offset }) => {
            const { role } = ctx.req.params;

            const condition =
                role === "gym" ? `h.reported_role = 'gym'` : `h.reported_role = 'trainer'`;

            // Use INNER JOIN to only get reports where gym/trainer exists
            const joinSql =
                role === "gym"
                    ? `INNER JOIN ${TABLES.GYMS.gyms} as u ON u.gym_id = h.reported_user_id`
                    : `
                    INNER JOIN ${TABLES.TRAINERS.trainers} as u ON u.trainer_id = h.reported_user_id
                    LEFT JOIN ${TABLES.MEMBERSHIP_JOIN.TRAINER_GYMS} as tg ON tg.trainer_id = u.trainer_id
                    `;

            const sql = find(`${TABLES.ABUSE_REPORTS.HISTORY} as h`, {
                sort: { "h.id": -1 },
                joins: joinSql,
                columns: `
        h.*,
        u.*
       ${role === 'trainer' ?
                        `
        , CASE
            WHEN tg.assigned_at IS NOT NULL THEN tg.gym_id
            ELSE NULL
        END AS is_gym_id
                    `: ""
                    }
    `,
                limitSkip: {
                    limit,
                    skip: offset,
                },
                where: condition,
            });

            const count = find(`${TABLES.ABUSE_REPORTS.HISTORY} as h`, {
                columns: "count(*) as count",
                joins: joinSql,
                where: condition,
            });

            const { success, result, error } = await dbQuery<any[]>(`${sql}${count}`);
            console.log(error);

            if (!success) {
                return { data: [], total: 0 };
            }

            return {
                data: result?.[0],
                total: result?.[1]?.[0]?.count,
            };
        },
    })
);

adminAbuseReport.delete("/:role/:report_id", async (ctx) => {
    const report_id = ctx.req.params.report_id;

    if (!report_id) {
        return ctx.json({ success: false, message: "Report ID is required" });
    }

    const { success, result, error } = await dbQuery<any>(
        `DELETE FROM ${TABLES.ABUSE_REPORTS.HISTORY} WHERE id = ${sanitize(report_id)}`
    );

    if (!success) {
        return ctx.json({ success: false, message: "Failed to delete report" });
    }

    if (result?.affectedRows === 0) {
        return ctx.json({ success: false, message: "No report found with this ID" });
    }

    return ctx.json({ success: true, message: "Report deleted successfully" });
});


export default adminAbuseReport;
