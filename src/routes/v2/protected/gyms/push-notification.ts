import { Router } from "tezx";
import { dbQuery, TABLES } from "../../../../models";
import { destroy, find, insert, sanitize } from "@tezx/sqlx/mysql";
import { paginationHandler } from "tezx/middleware";

const pushNotification = new Router({
    basePath: 'push'
});
/**
 * ------------------------------------
 *  POST /push/send
 *  Create & send a notification
 * ------------------------------------
 */
pushNotification.post("/send", async (ctx) => {
    try {
        let { role, user_info } = ctx.auth ?? {};
        const { user_id } = user_info ?? {};
        const body = await ctx.req.json();
        // Basic validation
        const requiredFields = ["recipient_type", "recipient_id", "title", "message"];
        for (const field of requiredFields) {
            if (!body[field]) {
                return ctx.status(400).json({
                    success: false,
                    message: `Missing required field: ${field}`,
                });
            }
        }

        const payload = {
            recipient_type: body.recipient_type,
            recipient_id: body.recipient_id,
            sender_type: 'gym',
            sender_id: user_id,
            title: body.title,
            message: body.message,
            type: body.type ?? "alert",/**
            (
            'alert',
            'offer',
            'update',
            'announcement',
            'reminder',
            'payment_due',
            'class_schedule',
            'feedback',
            'achievement',
            'system_event'
        ) */
            metadata: body.metadata ? typeof body.metadata === "string" ? body.metadata : JSON.stringify(body.metadata) : undefined,
            action_url: body.action_url ?? undefined,
            priority: body.priority ?? "medium",
            delivery_method: body.delivery_method ?? "app",
            expires_at: body.expires_at ?? null,
        };

        const { success, result, error } = await dbQuery(
            insert(TABLES.NOTIFICATIONS, payload)
        );

        if (!success) {
            return ctx.status(500).json({ success: false, message: error || "Failed to send notification" });
        }

        return ctx.json({
            success: true,
            message: "Notification sent successfully",
            data: result,
        });
    } catch (err: any) {
        return ctx.status(500).json({
            success: false,
            message: err?.message ?? "Internal server error",
        });
    }
});

pushNotification.delete('/:notification_id', async (ctx) => {
    try {
        const { notification_id } = ctx.params;

        if (!notification_id) {
            return ctx.json({ success: false, message: "Notification ID is required" });
        }

        // Delete query
        const { success, result } = await dbQuery<any>(destroy(TABLES.NOTIFICATIONS, {
            where: `notification_id  = ${sanitize(notification_id)} AND sender_type = "gym"`
        }))

        if (result.affectedRows === 0) {
            return ctx.json({ success: false, message: "Notification not found" });
        }
        return ctx.json({
            success: true,
            message: "Notification deleted successfully"
        });
    } catch (error) {
        return ctx.json({ success: false, message: "Failed to delete notification" });
    }
});

pushNotification.get("/history", paginationHandler({
    getDataSource: async (ctx, { page, limit, offset }) => {
        const { role } = ctx.auth || {};
        const search = ctx?.req.query?.search
        const { user_id } = ctx.auth?.user_info || {};
        let condition = `sender_type = "${role}" AND sender_id = ${user_id}`
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

export default pushNotification;