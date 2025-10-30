import { insert } from "@tezx/sqlx/mysql";
import { dbQuery, TABLES } from "../models";

/** //! Notifications + Email
 * 1. wallet add fund
 * 2. withdraw
 * 3. support ticket reply
 * 4. create support ticket
 * 5. leave request status
 * 6. performance-ratings feedback
 * 7. booking request
 * 8. booking request accept
 * 9. booking request cancel + reject
 * 10. job-apply for gym see
 * 11. application update
 * 12. approve my service (trainer)
 * 13. badge verified status
 * 14. xprto (pvc) kyc verfied status
 * 15. assign client
 * 16. new booking for client 
 * 17. subscription 
 * 18. session
 */
export type NotificationType =
    'alert' | 'offer' | 'update' | 'announcement' | 'reminder' | 'payment_due' | 'class_schedule' | 'feedback' | 'achievement' | 'system_event';

export type DeliveryMethod = 'app' | 'email' | 'sms' | 'whatsapp';

export interface NotificationPayload {
    recipientId?: number;
    recipientType?: 'client' | 'trainer' | 'gym' | 'admin';
    senderType?: 'system' | 'admin' | 'gym' | 'trainer' | 'client';
    senderId?: number;
    title: string;
    message: string;
    type?: NotificationType;
    action_url?: string,
    link?: string;
    thumbnail?: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    deliveryMethod?: DeliveryMethod[];
    metadata?: object;
}

export async function sendNotification(payload: NotificationPayload, mode: 'all' | 'message' | 'lite' = 'all') {

    try {
        let sql = insert(TABLES.NOTIFICATIONS, {
            recipient_type: payload.recipientType!,
            recipient_id: payload.recipientId!,
            sender_type: payload.senderType || 'system',
            sender_id: payload.senderId!,
            title: payload.title,
            message: payload.message,
            type: payload.type || 'alert',
            action_url: payload.action_url!,
            link: payload.link!,
            thumbnail: payload.thumbnail!,
            priority: payload.priority || 'medium',
            // delivery_method: (payload.deliveryMethod || ['app']).join(','), // SET হিসেবে CSV
            metadata: JSON.stringify({
                ...payload.metadata,
                sentAt: new Date().toISOString(),
            }),
        });

        await dbQuery(sql);
        // 2️⃣ WebSocket or Push delivery
        if (mode !== 'lite') {
            // Example WebSocket push (pseudo-code)
            // const ws = new WebSocket('wss://tezx.papernxt.com/websocket');
            // ws.on('open', () => {
            //     ws.send(JSON.stringify({
            //         recipientType,
            //         recipientId,
            //         title,
            //         message,
            //         type,
            //         action_url,
            //         thumbnail,
            //         priority
            //     }));
            //     ws.close();
            // });
        }

        return {
            success: true,
            message: `✅ Notification sent successfully to ${recipientType}#${recipientId}`,
        };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}
