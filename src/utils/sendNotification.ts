
export type NotificationType =
    'alert' | 'offer' | 'update' | 'announcement' | 'reminder' | 'payment_due' | 'class_schedule' | 'feedback' | 'achievement' | 'system_event';

export type DeliveryMethod = 'app' | 'email' | 'sms' | 'whatsapp';

interface NotificationPayload {
    clientId?: number;
    trainerId?: number;
    senderType?: 'system' | 'admin' | 'gym_owner' | 'trainer';
    senderId?: number;
    title: string;
    message: string;
    type?: NotificationType;
    link?: string;
    thumbnail?: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    deliveryMethod?: DeliveryMethod[];
    metadata?: object;
}

// Professional Notification Utility
export async function sendNotification(payload: NotificationPayload, mode: 'all' | 'message' | 'lite' = 'all') {
    const {
        clientId,
        trainerId,
        senderType = 'system',
        senderId = null,
        title,
        message,
        type = 'alert',
        link = null,
        thumbnail = null,
        priority = 'medium',
        deliveryMethod = ['app'],
        metadata = {},
    } = payload;

    try {
        // // 1️⃣ Insert into notifications table
        // const sql = `
        // INSERT INTO notifications 
        // (client_id, trainer_id, sender_type, sender_id, title, message, type, priority, delivery_method, metadata)
        // VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        // `;

        // await db.query(sql, [
        //     clientId || null,
        //     trainerId || null,
        //     senderType,
        //     senderId,
        //     title,
        //     JSON.stringify({ message, link, thumbnail }), // store main message + optional link/thumbnail in JSON
        //     type,
        //     priority,
        //     deliveryMethod.join(','), // store SET as CSV
        //     JSON.stringify({ ...metadata, sentAt: new Date().toISOString() }),
        // ]);

        // 2️⃣ Push via WebSocket if mode requires
        if (mode !== 'lite') {
            // await new Promise<void>((resolve) => {
            //     const ws = new WebSocket('wss://tezx.papernxt.com/websocket');
            //     ws.on('open', () => {
            //         ws.send(
            //             JSON.stringify({
            //                 clientId,
            //                 trainerId,
            //                 title,
            //                 message,
            //                 link,
            //                 thumbnail,
            //                 type,
            //                 priority,
            //                 mode,
            //             })
            //         );
            //         ws.close();
            //         resolve();
            //     });
            //     ws.on('error', (err) => {
            //         console.error('WebSocket error:', err);
            //         resolve();
            //     });
            // });
        }

        return { success: true, message: `Notification sent | clientId=${clientId} | title="${title}" | type=${type} | mode=${mode}` }
    }
    catch (error: any) {
        return { success: false, message: error?.message }
    }
}
