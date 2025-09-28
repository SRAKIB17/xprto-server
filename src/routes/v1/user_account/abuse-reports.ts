import { find, sanitize } from "@tezx/sqlx/mysql";
import { Router } from "tezx";
import { paginationHandler } from "tezx/middleware";
import { dbQuery, TABLES } from "../../../models/index.js";

const abuse_reports = new Router({
    basePath: "abuse-reports"
});

abuse_reports.get(
    "/",
    paginationHandler({
        getDataSource: async (ctx, { page, limit, offset }) => {
            const { role } = ctx.auth || {};
            const { user_id, username, hashed, salt, email } = ctx.auth?.user_info || {};
            let condition = `reporter_role = "${role}" AND reporter_user_id = ${user_id}`
            let sql = find(TABLES.ABUSE_REPORTS.HISTORY, {
                sort: {
                    id: -1
                },
                limitSkip: {
                    limit: limit,
                    skip: offset
                },
                where: condition,
            })
            let count = find(TABLES.ABUSE_REPORTS.HISTORY, {
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


export default abuse_reports;