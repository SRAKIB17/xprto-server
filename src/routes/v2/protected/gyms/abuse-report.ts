import { find, sanitize } from "@tezx/sqlx/mysql";
import { Router } from "tezx";
import { paginationHandler } from "tezx/middleware";
import { dbQuery, TABLES } from "../../../../models";

const gymAbuseReport = new Router();

gymAbuseReport.get("/",
    paginationHandler({
        getDataSource: async (ctx, { page, limit, offset }) => {
            const { role } = ctx.req.params;
            const { user_id, } = ctx.auth?.user_info || {};

            const condition = `h.reported_role = 'trainer' AND tg.gym_id = ${sanitize(user_id)}`;

            // Use INNER JOIN to only get reports where gym/trainer exists
            const joinSql = `
                    INNER JOIN ${TABLES.TRAINERS.trainers} as u ON u.trainer_id = h.reported_user_id
                    LEFT JOIN ${TABLES.MEMBERSHIP_JOIN.TRAINER_GYMS} as tg ON tg.trainer_id = u.trainer_id
                    `;

            const sql = find(`${TABLES.ABUSE_REPORTS.HISTORY} as h`, {
                sort: { "h.id": -1 },
                joins: joinSql,
                columns: `h.*, u.*`,
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

gymAbuseReport.delete("/:report_id", async (ctx) => {
    const report_id = ctx.req.params.report_id;

    if (!report_id) {
        return ctx.json({ success: false, message: "Report ID is required" });
    }

    // Check if the report exists and belongs to a trainer
    const { success: findSuccess, result: findResult, error: findError } = await dbQuery<any>(
        find(`${TABLES.ABUSE_REPORTS.HISTORY} as h`, {
            joins: `
                INNER JOIN ${TABLES.TRAINERS.trainers} as u ON u.trainer_id = h.reported_user_id
                LEFT JOIN ${TABLES.MEMBERSHIP_JOIN.TRAINER_GYMS} as tg ON tg.trainer_id = u.trainer_id
            `,
            where: `h.id = ${sanitize(report_id)} AND h.reported_role = 'trainer'`
        })
    );

    if (!findSuccess || !findResult?.length) {
        return ctx.json({ success: false, message: "No trainer report found with this ID" });
    }

    // Delete the report
    const { success, result, error } = await dbQuery<any>(
        `DELETE FROM ${TABLES.ABUSE_REPORTS.HISTORY} WHERE id = ${sanitize(report_id)}`
    );

    if (!success) {
        console.error("Delete Error:", error);
        return ctx.json({ success: false, message: "Failed to delete report" });
    }

    return ctx.json({ success: true, message: "Report deleted successfully" });
});



export default gymAbuseReport;
