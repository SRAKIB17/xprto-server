import { find, sanitize } from "@tezx/sqlx/mysql";
import { Router } from "tezx";
import { paginationHandler } from "tezx/middleware";
import { dbQuery, TABLES } from "../../../models/index.js";

const chat_rooms = new Router({
    basePath: "chat-rooms"
});

chat_rooms.get("/", paginationHandler({
    defaultLimit: 20,
    getDataSource: async (ctx, { page, limit, offset }) => {
        const { role } = ctx.auth || {};
        const { user_id, username, hashed, salt, email } = ctx.auth?.user_info || {};
        let condition = `chat_room_memberships.user_id = "${user_id}" AND chat_room_memberships.user_role = '${role}'`;

        let sql = find(TABLES.CHAT_ROOMS.chat_rooms, {
            joins: [
                {
                    type: "LEFT JOIN",
                    on: `chat_rooms.room_id = chat_room_memberships.room_id`,
                    table: TABLES.CHAT_ROOMS.memberships,
                },
                {
                    type: "LEFT JOIN",
                    on: `chat_rooms.room_id = chat_messages.room_id`,
                    table: TABLES.CHAT_ROOMS.messages,
                },
            ],
            columns: `
             chat_rooms.*,
              MAX(chat_messages.updated_at) AS last_message_updated_at,
              chat_messages.text AS message
            `,
            sort: {
                "last_message_updated_at": -1
            },
            limitSkip: {
                limit: limit,
                skip: offset
            },
            where: condition,
        });

        let count = find(TABLES.CHAT_ROOMS.chat_rooms, {
            joins: [
                {
                    on: `chat_rooms.room_id = chat_room_memberships.room_id`,
                    table: TABLES.CHAT_ROOMS.memberships,
                },
            ],
            columns: 'count(*) as count',
            where: condition,
        });

        const { success, result, error } = await dbQuery<any[]>(`${sql}${count}`);

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

chat_rooms.get("/:room_id", async (ctx) => {
    const { room_id } = ctx.req.params;
    const { role } = ctx.auth || {};
    const { user_id } = ctx.auth?.user_info || {};

    // 1️⃣ Check if user is part of the room
    const chat_rooms_sql = find(TABLES.CHAT_ROOMS.chat_rooms, {
        joins: [
            {
                type: "LEFT JOIN",
                on: `chat_rooms.room_id = chat_room_memberships.room_id`,
                table: TABLES.CHAT_ROOMS.memberships,
            },
        ],
        where: `chat_rooms.room_id = ${sanitize(room_id)} 
                AND chat_room_memberships.user_id = "${user_id}" 
                AND chat_room_memberships.user_role = '${role}'`,
    });

    // 2️⃣ Get all other members (excluding self)
    const memberships_sql = find(TABLES.CHAT_ROOMS.memberships, {
        where: `room_id = ${sanitize(room_id)} 
                AND NOT (user_id = ${sanitize(user_id)} AND user_role = '${role}')`,
    });

    const { result, error } = await dbQuery(`${chat_rooms_sql}${memberships_sql}`);
    if (error) {
        return ctx.json({ success: false, message: "Database error", error });
    }

    const check_room = result?.[0]?.[0];
    const memberships = result?.[1];

    // 3️⃣ If user not in room, unauthorized
    if (!check_room) {
        return ctx.json({ success: false, message: "Unauthorized" });
    }

    // 4️⃣ If group chat, return all members directly
    const membersData: any[] = [];
    if (check_room.is_group && memberships?.length > 0) {
        // 🔹 For group: fetch all members
        for (const member of memberships as { user_role: string, user_id: number }[]) {
            const { user_role, user_id } = member;
            let table: string;
            let columns: string[];
            let condition = "";
            if (user_role === 'trainer') {
                condition = `trainer_id = ${sanitize(user_id)}`
                table = TABLES.TRAINERS.trainers;
                columns = [
                    "trainer_id", "fullname", "avatar", "phone", "specialization", "verified", "badge"
                ];
            } else {
                condition = `client_id = ${sanitize(user_id)}`
                table = TABLES.CLIENTS.clients;
                columns = [
                    "client_id", "fullname", "avatar", "phone", "email_verified", "is_pro"
                ];
            }

            const { result: userResult } = await dbQuery(find(table, {
                columns,
                where: condition,
                limitSkip: { limit: 1 }
            }));

            if (userResult?.[0]) {
                membersData.push({ ...userResult[0], user_role, user_id });
            }
        }

        return ctx.json({
            success: true,
            type: "group",
            data: {
                room: check_room,
                members: memberships,
            },
        });
    }

    // 5️⃣ If private chat (trainer <-> client)
    if (!check_room.is_group && memberships?.length > 0) {
        const { user_role, user_id: member_user_id } = memberships?.[0];
        let table = "";
        let columns: string[] = [];
        let condition = ''
        if (user_role === "trainer") {
            table = TABLES.TRAINERS.trainers;
            condition = `trainer_id = ${sanitize(member_user_id)}`
            columns = [
                "trainer_id",
                "fullname",
                "phone",
                "verified",
                "badge",
                "specialization",
                "avatar",
                "cover",
                "district",
                "state",
                "country",
            ];
        } else if (user_role === "client") {
            condition = `client_id = ${sanitize(member_user_id)}`
            table = TABLES.CLIENTS.clients;
            columns = [
                "client_id",
                "fullname",
                "phone",
                "avatar",
                "is_pro",
                "emergency_contact",
                "email_verified",
                "district",
                "state",
                "country",
            ];
        }

        const { result: userResult } = await dbQuery(
            find(table, {
                columns,
                where: condition,
                limitSkip: { limit: 1 },
            })
        );

        if (userResult?.[0]) {
            membersData.push({ ...userResult[0], user_role, user_id });
        };


        return ctx.json({
            success: true,
            data: {
                ...check_room,
                members: membersData,
            }
        });
    }

    // 6️⃣ Default fallback
    return ctx.json({ success: false, message: "No members found" });
});


chat_rooms.get("/:room_id/chats", paginationHandler({
    defaultLimit: 30,
    getDataSource: async (ctx, { page, limit, offset }) => {
        const { room_id } = ctx.req.params;
        const { role } = ctx.auth || {};
        const { user_id } = ctx.auth?.user_info || {};

        // 1️⃣ Check if user is part of the room
        const chat_rooms_sql = find(TABLES.CHAT_ROOMS.chat_rooms, {
            joins: [
                {
                    type: "LEFT JOIN",
                    on: `chat_rooms.room_id = chat_room_memberships.room_id`,
                    table: TABLES.CHAT_ROOMS.memberships,
                },
            ],
            where: `chat_rooms.room_id = ${sanitize(room_id)} 
                AND chat_room_memberships.user_id = "${user_id}" 
                AND chat_room_memberships.user_role = '${role}'`,
        });

        const { result, error } = await dbQuery(`${chat_rooms_sql}`);
        if (error) {
            return {
                data: [],
                total: 0
            };
        }

        const check_room = result?.[0];

        // 3️⃣ If user not in room, unauthorized
        if (!check_room) {
            return {
                data: [],
                total: 0
            };
        }

        // 4️⃣ If group chat, return all members directly

        const find_message = find(TABLES.CHAT_ROOMS.messages, {
            where: `room_id = ${check_room?.room_id}`,
            sort: {
                timestamp: 1
            },
            limitSkip: {
                limit: limit,
                skip: offset
            },
        })

        let count = find(TABLES.CHAT_ROOMS.messages, {
            columns: 'count(*) as count',
            where: `room_id = ${check_room?.room_id}`,
        });

        const { success, result: final, } = await dbQuery<any[]>(`${find_message}${count}`);
        // 6️⃣ Default fallback
        if (!success) {
            return {
                data: [],
                total: 0
            }
        }
        return {
            data: final?.[0],
            total: final?.[1]?.[0]?.count
        } as any
    }
}));


// notifications.delete('/delete/:id', async (ctx) => {
//     const { id } = ctx.req.params;
//     const { role, user_info } = ctx.auth || {};
//     const userId = user_info?.user_id;

//     if (!id) {
//         return ctx.json({ success: false, message: "Notification ID is required" });
//     }
//     try {
//         // 2️⃣ Delete the notification
//         const deleteSql = destroy(TABLES.NOTIFICATIONS, {
//             where: `notification_id = ${sanitize(id)} AND recipient_type = "${role}" AND recipient_id = ${userId}`
//         })
//         const { success: delSuccess } = await dbQuery(deleteSql);
//         if (delSuccess) {
//             return ctx.json({ success: true, message: "Notification deleted successfully" });
//         } else {
//             return ctx.json({ success: false, message: "Failed to delete notification" });
//         }
//     } catch (err) {
//         return ctx.json({ success: false, message: "Internal server error" });
//     }
// });

// // user_account_document_flag.delete('/documents/flag/:doc_id', async (ctx) => {
// //     const doc_id = ctx.req.params?.doc_id;
// //     const user_id = ctx.auth?.user_info?.user_id || '';

// //     if (!doc_id || !user_id) {
// //         return ctx.json({
// //             success: false,
// //             message: "Missing user ID or document ID.",
// //         }, 400);
// //     }

// //     try {
// //         const { success, result } = await db
// //             .delete(table_schema.document_reactions, {
// //                 where: db.condition({
// //                     user_id,
// //                     doc_id,
// //                 }),
// //             })
// //             .execute();

// //         if (success) {
// //             return ctx.json({
// //                 success: true,
// //                 message: "Your reaction has been removed successfully.",
// //                 data: result,
// //             });
// //         } else {
// //             return ctx.json({
// //                 success: false,
// //                 message: "Reaction not found or could not be deleted.",
// //             }, 404);
// //         }

// //     } catch (error) {
// //         return ctx.json({
// //             success: false,
// //             message: "Internal server error while removing the reaction.",
// //         }, 500);
// //     }
// // });
// abuse_reports.post('/documents/flag/:doc_id', async (ctx) => {
//     const doc_id = ctx.req.params?.doc_id;
//     const { user_id, fullname, email } = ctx.auth?.user_info || {};
//     const { description, reason, url, title } = await ctx.req.json();

//     if (!user_id) {
//         return ctx.status(400).json({
//             success: false,
//             message: "Please login to flag a document.",
//         });
//     }
//     if (!user_id || !doc_id || !reason) {
//         return ctx.status(400).json({
//             success: false,
//             message: "Missing required data (user, document, or reason).",
//         });
//     }

//     // 🔔 Notify via email
//     await sendEmail({
//         to: email || 'rakibulssc5@gmail.com',
//         subject: "[PaperNxt] Document Flag Received – Thank You for Reporting",
//         templateData: {
//             description,
//             name: fullname || "User",
//             reason,
//             title,
//             url: `${CLIENT_URL}${url}`,
//         },
//         templateName: 'flag-document-notify-user',
//     });

//     try {
//         const { success, result, error, errno } = await db.create(
//             table_schema.document_flags,
//             {
//                 user_id,
//                 doc_id,
//                 reason,
//                 description,
//             },
//             {
//                 onDuplicateUpdateFields: ['reason', 'description', 'resolved_at', 'is_resolved']
//             }
//         ).execute();

//         if (success) {
//             return ctx.json({
//                 success: true,
//                 message: "Document has been flagged successfully.",
//                 data: result,
//             });
//         } else {
//             if (errno === 1062) {
//                 return ctx.status(409).json({
//                     success: false,
//                     message: "You’ve already flagged this document.",
//                 });
//             }

//             return ctx.status(500).json({
//                 success: false,
//                 message: error || "Failed to flag the document.",
//             });
//         }
//         // ctx.req.remoteAddress.address + ctx.req.remoteAddress.port

//     } catch (error) {
//         return ctx.status(500).json({
//             success: false,
//             message: "Internal server error while flagging the document.",
//         });
//     }
// });


export default chat_rooms;