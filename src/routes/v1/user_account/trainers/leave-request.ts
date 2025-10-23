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

import { destroy, find, sanitize } from "@tezx/sqlx/mysql";
import { Router } from "tezx";
import { paginationHandler } from "tezx/middleware";
import { dbQuery, TABLES } from "../../../../models/index.js";

// import user_account_document_flag from "./flag-document.js";
const leaveRequest = new Router({
    basePath: '/notifications'
});
//! docs done
leaveRequest.get(
    "/",
    paginationHandler({
        getDataSource: async (ctx, { page, limit, offset }) => {
            const { role } = ctx.auth || {};
            const search = ctx?.req.query?.search
            const { user_id, username, hashed, salt, email } = ctx.auth?.user_info || {};
            let condition = `recipient_type = "${role}" AND recipient_id = ${user_id}`
            if (search) {
                condition += ` AND MATCH(title, message) AGAINST (${sanitize(search)} IN NATURAL LANGUAGE MODE)`;
            }
            let sql = find(TABLES.NOTIFICATIONS, {
                sort: {
                    sent_at: -1
                },
                limitSkip: {
                    limit: limit,
                    skip: offset
                },
                where: condition,
            })
            let count = find(TABLES.NOTIFICATIONS, {
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

leaveRequest.delete('/delete/:id', async (ctx) => {
    const { id } = ctx.req.params;
    const { role, user_info } = ctx.auth || {};
    const userId = user_info?.user_id;

    if (!id) {
        return ctx.json({ success: false, message: "Notification ID is required" });
    }
    try {
        // 2️⃣ Delete the notification
        const deleteSql = destroy(TABLES.NOTIFICATIONS, {
            where: `notification_id = ${sanitize(id)} AND recipient_type = "${role}" AND recipient_id = ${userId}`
        })
        const { success: delSuccess } = await dbQuery(deleteSql);
        if (delSuccess) {
            return ctx.json({ success: true, message: "Notification deleted successfully" });
        } else {
            return ctx.json({ success: false, message: "Failed to delete notification" });
        }
    } catch (err) {
        return ctx.json({ success: false, message: "Internal server error" });
    }
});

export default leaveRequest;