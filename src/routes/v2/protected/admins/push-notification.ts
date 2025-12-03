import { Router } from "tezx";
import { dbQuery, TABLES } from "../../../../models";
import { insert } from "@tezx/sqlx/mysql";

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

export default pushNotification;