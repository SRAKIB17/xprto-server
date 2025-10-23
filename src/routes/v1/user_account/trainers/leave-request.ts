// import { mysql_datetime, sanitize } from "@dbnx/mysql";
// import fs, { existsSync, renameSync } from "node:fs";
// import path from "node:path";
// import sharp from "sharp";
// import { Router } from "tezx";
// import { useFormData } from "tezx/helper";
// import { paginationHandler } from "tezx/middleware/pagination";
// import { support_email } from "../../../config.js";
// import { sendEmail } from "../../../email/mailer.js";
// import { db, table_schema } from "../../../models/index.js";
// import { wrappedCryptoToken } from "../../../utils/crypto.js";
// import { AuthorizationMiddlewareUser } from "../auth/basicAuth.js";
// import user_account_bookmark from "./bookmark.js";

import { find, insert, mysql_date, sanitize } from "@tezx/sqlx/mysql";
import { Router } from "tezx";
import { paginationHandler } from "tezx/middleware";
import { DirectoryServe, filename } from "../../../../config.js";
import { dbQuery, TABLES } from "../../../../models/index.js";
import { copyFile } from "../../../../utils/fileExists.js";

// import user_account_document_flag from "./flag-document.js";
const leaveRequest = new Router({
    basePath: '/leave-requests'
});
//! docs done
leaveRequest.get(
    "/",
    paginationHandler({
        getDataSource: async (ctx, { page, limit, offset }) => {
            const { role } = ctx.auth || {};
            const { search, tab } = ctx?.req.query
            const { user_id } = ctx.auth?.user_info || {};
            let condition = role === 'trainer' ? `lr.trainer_id = ${user_id}` : `lr.gym_id = ${user_id}`
            if (tab) {
                condition += ` AND lr.status = ${sanitize(tab)}`
            }
            if (search) {
                condition += ` AND MATCH(title, message) AGAINST (${sanitize(search)} IN NATURAL LANGUAGE MODE)`;
            }
            let sql = find(`${TABLES.TRAINERS.LEAVE_REQUESTS} as lr`, {
                sort: {
                    created_at: -1
                },
                joins: `
                 LEFT JOIN ${TABLES.TRAINERS.trainers} as t ON lr.trainer_id = t.trainer_id
                 LEFT JOIN ${TABLES.GYMS.gyms} as g ON lr.gym_id = g.gym_id
                 `,
                columns: `  
                lr.*,
                t.fullname as trainer_name,
                t.avatar as trainer_avatar,
                t.email as trainer_email,
                g.gym_name as gym_name,
                g.avatar as gym_avatar,
                g.logo_url as gym_logo
                `,
                limitSkip: {
                    limit: limit,
                    skip: offset
                },
                where: condition,
            })
            let count = find(`${TABLES.TRAINERS.LEAVE_REQUESTS} as lr`, {
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

leaveRequest.post('/apply', async (ctx) => {
    try {

        const { role, user_info } = ctx.auth || {};
        const userId = user_info?.user_id;
        const { start_date, end_date, gym_id, leave_type, is_paid, reason, attachments, retroactive } = await ctx.req.json();
        let finalAttachments: string[] = [];

        if (Array.isArray(attachments)) {
            for (const att of attachments) {
                // assume `att` is client temp file path or filename
                const fileName = filename(att); // extract filename
                const destPath = DirectoryServe.LeaveRequestAttachments(fileName);

                const copied = await copyFile(att, destPath, true);
                if (copied) {
                    finalAttachments.push(destPath); // store relative path or URL
                }
            }
        }

        const sql = insert(TABLES.TRAINERS.LEAVE_REQUESTS, {
            start_date: mysql_date(start_date),
            end_date: mysql_date(end_date),
            leave_type,
            is_paid,
            trainer_id: userId,
            gym_id: gym_id,
            reason,
            attachments: finalAttachments?.length ? JSON.stringify(finalAttachments) : undefined,
            retroactive
        })
        const { success } = await dbQuery(sql);


        if (!success) {
            return ctx.json({ success: false, message: "Failed to save leave request" });
        }

        return ctx.json({ success: true, message: "Leave request submitted successfully" });

    } catch (err) {
        console.error("Leave request error:", err);
        return ctx.json({ success: false, message: "Internal server error" });
    }
});

export default leaveRequest;