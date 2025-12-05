import { destroy, find, sanitize } from "@tezx/sqlx/mysql";
import { Router } from "tezx";
import { paginationHandler } from "tezx/middleware";
import { dbQuery, TABLES } from "../../../models/index.js";

const notifications = new Router({
    basePath: '/notifications'
});
//! docs done
notifications.get("/", paginationHandler({
    getDataSource: async (ctx, { page, limit, offset }) => {
        const { role } = ctx.auth || {};
        const search = ctx?.req.query?.search
        const { user_id } = ctx.auth?.user_info || {};
        let condition = role === 'admin' ? `recipient_type = "${role}"` : `recipient_type = "${role}" AND recipient_id = ${user_id}`
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

notifications.delete('/delete/:id', async (ctx) => {
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

export default notifications;