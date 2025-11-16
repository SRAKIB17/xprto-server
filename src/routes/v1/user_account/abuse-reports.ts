import { find, insert, sanitize } from "@tezx/sqlx/mysql";
import { Router } from "tezx";
import { paginationHandler } from "tezx/middleware";
import { dbQuery, TABLES } from "../../../models/index.js";
import { copyFile } from "../../../utils/fileExists.js";
import { DirectoryServe, filename } from "../../../config.js";

const abuse_reports = new Router({
    basePath: "abuse-reports"
});

abuse_reports.get(
    "/",
    paginationHandler({
        getDataSource: async (ctx, { page, limit, offset }) => {
            const { role } = ctx.auth || {};
            const { user_id, username, hashed, salt, email } = ctx.auth?.user_info || {};
            let condition = `reporter_role = "${role}" AND reporter_user_id = ${user_id}`
            let sql = find(TABLES.ABUSE_REPORTS.HISTORY, {
                sort: {
                    id: -1
                },
                limitSkip: {
                    limit: limit,
                    skip: offset
                },
                where: condition,
            })
            let count = find(TABLES.ABUSE_REPORTS.HISTORY, {
                columns: 'count(*) as count',
                where: condition,
            })
            const { success, result } = await dbQuery<any[]>(`${sql}${count}`);
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
abuse_reports.post('/', async (ctx) => {
    const { user_id, fullname, email } = ctx.auth?.user_info || {};

    if (!user_id) {
        return ctx.json({ success: false, message: "Authentication required" });
    }

    try {
        const body = await ctx.req.json();
        const {
            reported_user_id,
            reported_role,
            report_type,
            details,
            evidence_url
        } = body;

        // Simple validation
        if (!reported_user_id || !report_type || !details) {
            return ctx.json({
                success: false,
                message: "reported_user_id, report_type and details are required"
            });
        }
        let evidences: any[] = [];
        if (Array.isArray(evidence_url)) {
            for (const img of evidence_url) {
                if (await copyFile(img, DirectoryServe.abuseReport.evidence_url(img), true)) {
                    evidences.push(filename(img));
                }
            }
        }
        // Insert into DB
        const sql = insert(TABLES.ABUSE_REPORTS.HISTORY, {
            reported_user_id,
            reported_role,
            report_type,
            reporter_user_id: user_id,
            reporter_role: (ctx?.auth ?? {})?.role,
            details,
            evidence_url: evidences?.length ? JSON.stringify(evidences) : undefined
        })
        const { success, result, error } = await dbQuery<any>(sql);

        if (!success) {
            return ctx.json({ success: false, message: "Failed to save report", error });
        }

        return ctx.json({
            success: true,
            message: "Abuse report submitted successfully",
            report_id: result.insertId
        });

    } catch (err: any) {
        console.error(err);
        return ctx.json({
            success: false,
            message: "Internal server error",
            error: err.message
        });
    }
});



export default abuse_reports;