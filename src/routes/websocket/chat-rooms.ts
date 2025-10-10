import { insert, sanitize, update } from "@tezx/sqlx/mysql";
import { Callback, Router } from "tezx";
import { upgradeWebSocket } from "tezx/bun";
import { DirectoryServe, filename } from "../../config.js";
import { dbQuery, TABLES } from "../../models/index.js";
import { copyFile } from "../../utils/fileExists.js";
import { AuthorizationControllerUser } from "../v1/auth/basicAuth.js";

export const chat_room_clients = new Map<number, Map<string, WebSocket>>(); // store user_id/request_id → ws

const chat_rooms = new Router({
    basePath: "/chat-rooms",
});


chat_rooms.get("/:room_id", upgradeWebSocket((ctx) => {
    // Extract identity (user or guest)
    return {
        open: async (ws) => {
            let check = await AuthorizationControllerUser({ credentials: { token: ctx.req.query?.s_id }, ctx });
            if (!check) {
                return ws.send(JSON.stringify({ 'type': "unauthorize" }))
            }
        },
        message: async (ws, data: any) => {
            try {
                function Broadcast(data: any) {
                    let get = chat_room_clients?.get(ctx.req.params?.room_id as any);
                    if (get) {
                        get.forEach((r, key) => {
                            if (r?.readyState === WebSocket.OPEN) {
                                if (r !== ws) {
                                    return r.send(JSON.stringify(data));
                                }
                            }
                            else {
                                get.delete(key);
                            }
                        })
                    }
                }

                function Online() {
                    let get = chat_room_clients?.get(ctx.req.params?.room_id as any);
                    let online: any = [];
                    get?.entries()?.forEach(r => {
                        if (r?.[1]?.readyState === WebSocket.OPEN) {
                            online.push(JSON.parse(r?.[0]))
                        }
                        else {
                            get.delete(r?.[0])
                        }
                    })
                    ws.send(JSON.stringify({
                        type: 'online',
                        online: online
                    }));
                }
                const parsed = JSON.parse(data.toString());
                const { type, ...props } = parsed;
                if (type === 'connecting') {
                    const { user_role, user_id, avatar } = parsed?.payload;
                    let id = JSON.stringify({ user_role, user_id, avatar });
                    let get = chat_room_clients?.get(ctx.req.params?.room_id as any);
                    if (get) {
                        get.set(id, ws);
                    }
                    else {
                        chat_room_clients.set(ctx.req.params?.room_id as any, new Map([[id, ws]]));
                    }
                    Online();
                    return;
                }
                if (type === 'typing') {
                    Broadcast({
                        type: parsed?.is_typing ? 'typing' : 'blurred',
                        info: {
                            avatar: ctx.auth?.user_info?.avatar,
                            user_id: ctx.auth?.user_info?.user_id,
                            fullname: ctx.auth?.user_info?.fullname,
                            user_role: ctx.auth?.role,
                        }
                    })
                    return
                }
                if (type === 'blurred') {
                    Broadcast({
                        type: 'blurred',
                        info: {
                            avatar: ctx.auth?.user_info?.avatar,
                            user_id: ctx.auth?.user_info?.user_id,
                            fullname: ctx.auth?.user_info?.fullname,
                            user_role: ctx.auth?.role,
                        }
                    })
                    return
                }
                if (type === 'read') {
                    const { room_id, last_message_id, user_id, role } = parsed;

                    // DB update: এই room এর সব message যেগুলো recipient দেখেছে
                    const query = update(TABLES.CHAT_ROOMS.messages, {
                        values: {
                            is_read: 1,
                        },
                        where: `room_id = ${sanitize(room_id)} AND message_id <= ${sanitize(last_message_id)} AND NOT (user_id = ${sanitize(ctx.auth.user_info.user_id ?? user_id)} AND sender_role = '${(ctx.auth.role ?? role)?.[0]}')`
                    })

                    await dbQuery(query);
                    // Broadcast update to other clients in room
                    const clients = chat_room_clients.get(room_id);
                    clients?.forEach((clientWs) => {
                        if (clientWs.readyState === WebSocket.OPEN) {
                            clientWs.send(JSON.stringify({
                                type: 'read_receipt',
                                last_message_id,
                                user_id: ctx.auth.user_info.user_id
                            }));
                        }
                    });

                    return;
                }

                if (type === 'message') {
                    const { attachments, message_type, text, message_id, room_id } = props;
                    let finalAttachments = [];
                    if (Array.isArray(attachments)) {
                        for (const att of attachments) {
                            // ধরে নিচ্ছি att হচ্ছে client থেকে আসা temp path বা file name
                            const fileName = filename(att);
                            let check = await copyFile(att, DirectoryServe.chat_messages(fileName));
                            if (check) {
                                finalAttachments.push(`/${fileName}`);
                            }

                        }
                    }

                    let data = {
                        attachments: finalAttachments?.length ? JSON.stringify(finalAttachments) : undefined,
                        user_id: ctx.auth.user_info?.user_id,
                        sender_role: ctx?.auth?.role?.[0],
                        room_id: room_id ?? ctx?.req?.params?.room_id,
                        message_type: message_type,
                        text: text,
                    }

                    ws.send(JSON.stringify({
                        type: "my-message",
                        message: { ...props, ...data }
                    }));

                    let { result, success, error } = await dbQuery(insert(TABLES.CHAT_ROOMS.messages, data))
                    if (success) {
                        Broadcast({
                            type: 'inbox',
                            message: data
                        })
                        return ws.send(JSON.stringify({ type: "send", message_id: message_id }))
                    }
                    else {
                        return ws.send(JSON.stringify({ type: "failed", message_id: message_id }))
                    }
                }

            } catch (err) {
                console.error("Message error:", err);
                ws.send(JSON.stringify({ type: "error", message: "Bad payload" }));
            }
        },
        close(ws) {
            let get = chat_room_clients?.get(ctx.req.params?.room_id as any);
            if (get?.size === 0) {
                chat_room_clients.delete(ctx.req.params?.room_id as any)
            }
            get?.forEach((w, k) => {
                if (w === ws) {
                    get.delete(k);
                }
            })

        },
    };
}) as unknown as Callback
);

export { chat_rooms };
