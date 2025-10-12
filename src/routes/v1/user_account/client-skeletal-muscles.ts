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

import { destroy, find, insert, mysql_datetime, sanitize, update } from "@tezx/sqlx/mysql";
import { Router } from "tezx";
import { paginationHandler } from "tezx/middleware";
import { dbQuery, TABLES } from "../../../models/index.js";

const client_skeletal_muscles = new Router({
    basePath: '/clients/skeletal-muscles'
});

client_skeletal_muscles.get('/stats/:client_id', async (ctx) => {
    try {
        const { user_id, username, hashed, salt, email } = ctx.auth?.user_info || {};
        const { role } = ctx.auth || {};

        const query = find(`${TABLES.CLIENTS.skeletal_muscles} as cm`, {
            joins: [
                {
                    table: `${TABLES.CLIENTS.clients} as cl`,
                    on: `cl.client_id = cm.client_id`,
                    type: "LEFT JOIN",
                }
            ],
            columns: `
              cm.client_id,
              cl.fullname,
              cl.avatar,
              ROUND(AVG(cm.whole_body_percent), 2) AS avg_whole_body,
              ROUND(AVG(cm.trunk_percent), 2) AS avg_trunk,
              ROUND(AVG(cm.arms_percent), 2) AS avg_arms,
              ROUND(AVG(cm.legs_percent), 2) AS avg_legs,
              ROUND(MAX(cm.whole_body_percent), 2) AS max_whole_body,
              ROUND(MIN(cm.whole_body_percent), 2) AS min_whole_body,
              COUNT(cm.skeletal_id) AS total_records
            `,
            where: `cm.client_id = ${role === 'trainer' ? ctx.req.params?.client_id : user_id}`,
            groupBy: `cm.client_id, cl.fullname, cl.avatar`,
            sort: `avg_whole_body DESC`
        })
        const { success, result, error } = await dbQuery(query);
        if (!success) {
            return ctx.json({
                success: false,
                message: "Failed to fetch skeletal muscle statistics",
            });
        }

        return ctx.json({
            success: true,
            message: "Skeletal muscle statistics fetched successfully",
            data: result?.[0],
        });
    } catch (error) {
        return ctx.json({
            success: false,
            message: "Internal server error",
        });
    }
});

client_skeletal_muscles.get("/", paginationHandler({
    getDataSource: async (ctx, { page, limit, offset }) => {
        const { role } = ctx.auth || {};
        const { user_id, username, hashed, salt, email } = ctx.auth?.user_info || {};
        let client_id = user_id;
        if (role === 'trainer') {
            client_id = ctx?.req?.query?.client_id
        }
        let condition = `client_id = ${client_id}`;
        if (role === 'trainer') {
            condition += `AND added_by = ${user_id}`
        }

        let sql = find(TABLES.CLIENTS.skeletal_muscles, {
            sort: {
                created_at: -1
            },
            joins: [
                {
                    type: "LEFT JOIN",
                    on: `client_skeletal_muscles.added_by = trainers.trainer_id`,
                    table: TABLES.TRAINERS.trainers
                }
            ],
            columns: `client_skeletal_muscles.*, trainers.fullname, trainers.avatar`,
            limitSkip: {
                limit: limit,
                skip: offset
            },
            where: condition,
        })
        let count = find(TABLES.CLIENTS.skeletal_muscles, {
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
})
);

client_skeletal_muscles.delete('/delete/:id', async (ctx) => {
    const { id } = ctx.req.params;
    const { role, user_info } = ctx.auth || {};
    const userId = user_info?.user_id;

    if (!id) {
        return ctx.json({ success: false, message: "Skeletal ID is required" });
    }
    try {
        // 2️⃣ Delete the notification
        const deleteSql = destroy(TABLES.CLIENTS.skeletal_muscles, {
            where: `skeletal_id = ${sanitize(id)}`
        })
        const { success: delSuccess } = await dbQuery(deleteSql);
        if (delSuccess) {
            return ctx.json({ success: true, message: "Skeletal record deleted successfully" });
        } else {
            return ctx.json({ success: false, message: "Failed to delete skeletal record" });
        }
    } catch (err) {
        return ctx.json({ success: false, message: "Internal server error" });
    }
});

client_skeletal_muscles.post('/add-edit', async (ctx) => {
    const { role, user_info } = ctx.auth || {};
    const userId = user_info?.user_id;

    try {
        const {
            skeletal_id,
            client_id,
            whole_body_percent,
            trunk_percent,
            arms_percent,
            legs_percent,
        } = await ctx.req.json();

        let query = '';
        let message = '';
        let action = '';

        // ✅ Update existing record
        if (skeletal_id) {
            query = update(TABLES.CLIENTS.skeletal_muscles, {
                values: {
                    whole_body_percent,
                    trunk_percent,
                    arms_percent,
                    legs_percent,
                    updated_at: mysql_datetime(),
                },
                where: `skeletal_id = ${skeletal_id}`,
            });
            message = 'Skeletal record updated successfully';
            action = 'update';
        }

        // ✅ Insert new record
        else {
            query = insert(TABLES.CLIENTS.skeletal_muscles, {
                client_id: role === 'trainer' ? client_id : userId,
                added_by: role === 'trainer' ? userId : undefined,
                whole_body_percent,
                trunk_percent,
                arms_percent,
                legs_percent,
                updated_at: mysql_datetime(),
            });
            message = 'Skeletal record added successfully';
            action = 'insert';
        }

        // ✅ Execute query
        const { success, result, error } = await dbQuery<any>(query);

        if (!success) {
            console.error("DB Error:", error);
            return ctx.json({
                success: false,
                message: 'Database operation failed',
            });
        }

        // ✅ Respond to client
        return ctx.json({
            success: true,
            message,
            action,
            data: {
                skeletal_id: skeletal_id || result.insertId,
                client_id: role === 'trainer' ? client_id : userId,
                whole_body_percent,
                trunk_percent,
                arms_percent,
                legs_percent,
            },
        });
    } catch (err) {
        console.error("Add/Edit Error:", err);
        return ctx.json({
            success: false,
            message: 'Internal server error',
        });
    }
});




export default client_skeletal_muscles;