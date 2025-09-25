import { Router } from "tezx";
import { CLIENT_URL } from "../../../config.js";
import { sendEmail } from "../../../email/mailer.js";
import { db, table_schema } from "../../../models/index.js";

const user_account_document_flag = new Router();

// user_account_document_flag.delete('/documents/flag/:doc_id', async (ctx) => {
//     const doc_id = ctx.req.params?.doc_id;
//     const user_id = ctx.auth?.user_info?.user_id || '';

//     if (!doc_id || !user_id) {
//         return ctx.json({
//             success: false,
//             message: "Missing user ID or document ID.",
//         }, 400);
//     }

//     try {
//         const { success, result } = await db
//             .delete(table_schema.document_reactions, {
//                 where: db.condition({
//                     user_id,
//                     doc_id,
//                 }),
//             })
//             .execute();

//         if (success) {
//             return ctx.json({
//                 success: true,
//                 message: "Your reaction has been removed successfully.",
//                 data: result,
//             });
//         } else {
//             return ctx.json({
//                 success: false,
//                 message: "Reaction not found or could not be deleted.",
//             }, 404);
//         }

//     } catch (error) {
//         return ctx.json({
//             success: false,
//             message: "Internal server error while removing the reaction.",
//         }, 500);
//     }
// });
user_account_document_flag.post('/documents/flag/:doc_id', async (ctx) => {
    const doc_id = ctx.req.params?.doc_id;
    const { user_id, fullname, email } = ctx.auth?.user_info || {};
    const { description, reason, url, title } = await ctx.req.json();

    if (!user_id) {
        return ctx.status(400).json({
            success: false,
            message: "Please login to flag a document.",
        });
    }
    if (!user_id || !doc_id || !reason) {
        return ctx.status(400).json({
            success: false,
            message: "Missing required data (user, document, or reason).",
        });
    }

    // 🔔 Notify via email
    await sendEmail({
        to: email || 'rakibulssc5@gmail.com',
        subject: "[PaperNxt] Document Flag Received – Thank You for Reporting",
        templateData: {
            description,
            name: fullname || "User",
            reason,
            title,
            url: `${CLIENT_URL}${url}`,
        },
        templateName: 'flag-document-notify-user',
    });

    try {
        const { success, result, error, errno } = await db.create(
            table_schema.document_flags,
            {
                user_id,
                doc_id,
                reason,
                description,
            },
            {
                onDuplicateUpdateFields: ['reason', 'description', 'resolved_at', 'is_resolved']
            }
        ).execute();

        if (success) {
            return ctx.json({
                success: true,
                message: "Document has been flagged successfully.",
                data: result,
            });
        } else {
            if (errno === 1062) {
                return ctx.status(409).json({
                    success: false,
                    message: "You’ve already flagged this document.",
                });
            }

            return ctx.status(500).json({
                success: false,
                message: error || "Failed to flag the document.",
            });
        }
        // ctx.req.remoteAddress.address + ctx.req.remoteAddress.port

    } catch (error) {
        return ctx.status(500).json({
            success: false,
            message: "Internal server error while flagging the document.",
        });
    }
});


export default user_account_document_flag;