
import { sanitize, update } from "@tezx/sqlx/mysql";
import { Router } from "tezx";
import { DirectoryServe, filename } from "../../../config.js";
import { dbQuery } from "../../../models/index.js";
import { wrappedCryptoToken } from "../../../utils/crypto.js";
import { copyFile } from "../../../utils/fileExists.js";
import { AuthorizationBasicAuthUser } from "../auth/basicAuth.js";
import abuse_reports from "./abuse-reports.js";
import chat_rooms from "./chat-rooms.js";
import client_skeletal_muscles from "./client-muscles_record.js";
import client_health_conditions from "./client_health_conditions.js";
import clients from "./clients/index.js";
import earningDashboardGymTrainer from "./earning-dashboard.js";
import membershipJoinGTC from "./memberships/membership-trainer-client-gym.js";
import my_documents from "./my-documents.js";
import notifications from "./notifications.js";
import support_tickets from "./support-ticket.js";
import trainers from "./trainers/index.js";
import my_wallet from "./wallet.js";
import trainerClientModule from "./client-trainer/index.js";

const user_account = new Router();
user_account.use(AuthorizationBasicAuthUser());
user_account.use(notifications);
user_account.use(trainers);
user_account.use(clients);
user_account.use(my_documents);
user_account.use(abuse_reports);
user_account.use(trainerClientModule);
user_account.use(my_wallet);
user_account.use(membershipJoinGTC);
user_account.use(support_tickets);
user_account.use(chat_rooms);
user_account.use(earningDashboardGymTrainer);
user_account.use(client_skeletal_muscles);
user_account.use(client_health_conditions);
// user_account.put('/avatar-upload', async (ctx) => {
//     const formData = await useFormData(ctx);
//     const avatar = formData.avatar;
//     let { user_id, username } = ctx.auth?.user_info

//     if (!(avatar instanceof File)) {
//         return ctx.status(400).json({ error: "Invalid file" });
//     }
//     const buffer = await avatar.arrayBuffer();
//     const name = `${username}.webp`;
//     const inputBuffer = Buffer.from(buffer);
//     // Use username from session/auth, or fallback to UUID
//     const outputPath = path.resolve("uploads/avatars", name);

//     try {
//         await sharp(inputBuffer)
//             .resize(256, 256) // optional: resize to square avatar
//             .webp({ quality: 85 })
//             .toFile(outputPath);

//         let { result, success } = await db.update(table_schema.user_details, {
//             values: {
//                 'updated_at': mysql_datetime(),
//                 avatar_url: `/images/avatars/${username}`,
//             },
//             where: db.condition({ user_id: user_id })
//         }).execute();
//         if (!success) {
//             throw new Error("Update Failed.")
//         }
//         return ctx.json({ success: true, name: name, avatar: `/images/avatars/${username}`, });
//     } catch (error) {
//         return ctx.status(500).json({ error: "Failed to process image" });
//     }
// });

// user_account.delete('/avatar-remove', async (ctx) => {
//     const { user_id, username, avatar_url } = ctx.auth?.user_info;
//     const filePath = path.resolve("uploads/avatars", `${avatar_url ? path.basename(avatar_url) : username}.webp`);
//     try {
//         await fs.promises.unlink(filePath); // remove the file
//         // update DB to clear avatar_url
//         await db.update(table_schema.user_details, {
//             values: {
//                 avatar_url: null,
//                 updated_at: mysql_datetime()
//             },
//             where: db.condition({ user_id })
//         }).execute();
//         return ctx.json({ success: true });
//     } catch (error) {
//         return ctx.status(500).json({ error: "Failed to remove avatar" });
//     }
// });
// !DONE DOCS
user_account.put('/update/my-info', async (ctx) => {
    const body = await ctx.req.json();
    try {
        const { user_id, email } = ctx.auth?.user_info || {};
        const role = ctx?.auth?.role;
        const table = ctx.auth.table;
        if (Object.keys(body)?.includes('email')) {
            return ctx.status(400).json({ message: "Email update is not allowed." });
        }
        if (body?.['avatar']) {
            let success = await copyFile(body?.avatar, DirectoryServe.avatar(role, body?.avatar), true);
            if (success) {
                body['avatar'] = `/${role}/${filename(body?.avatar)}`
            }
        }
        if (body?.['logo_url']) {
            let success = await copyFile(body?.avatar, DirectoryServe.logo(role, body?.avatar), true);
            if (success) {
                body['logo_url'] = `/${role}/${filename(body?.avatar)}`
            }
        }
        const { success, result, error } = await dbQuery(update(table, {
            values: body,
            where: `email = ${sanitize(email)}`
        }))
        if (success) {
            return ctx.json({ success: true, result });
        } else if (error?.errno === 1054) {
            return ctx.status(400).json({ message: "Invalid field(s) in update request." });
        } else {
            return ctx.status(500).json({ message: "Failed to update." });
        }
    }
    catch (error) {
        return ctx.status(500).json({ message: "Server error." });
    }
});

// user_account.put("/delete-account", async (ctx) => {
//     try {
//         const { user_id, username, fullname } = ctx.auth?.user_info || {};
//         const { type } = await ctx.req.json();
//         if (!user_id) {
//             return ctx.status(401).json({ success: false, message: "Unauthorized" },);
//         }
//         let date = type == 'delete' ? mysql_datetime() : null;
//         const { success, result } = await db.update(table_schema.user_details, {
//             values: {
//                 delete_requested_at: date,
//             },
//             where: db.condition({ user_id }),
//         }).execute();

//         if (!success) {
//             return ctx.status(500).json({ success: false, message: type == 'delete' ? "Failed to update account deletion request" : "Failed to cancel delete request." });
//         }
//         let delete_requested_at = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
//         if (type === 'delete') {
//             await sendEmail({
//                 subject: "Your Account Deletion Request – PaperNxt",
//                 to: ctx.auth?.user_info?.email,
//                 templateName: "account-delete",
//                 templateData: {
//                     name: fullname,
//                     date: new Date(delete_requested_at).toDateString(),
//                 }
//             });
//         } else {
//             await sendEmail({
//                 subject: "Your Account Deletion Request Has Been Cancelled – PaperNxt",
//                 to: ctx.auth?.user_info?.email,
//                 templateName: "account-delete-cancelled",
//                 templateData: {
//                     name: fullname,
//                     support_email: support_email
//                 }
//             });
//         }
//         return await ctx.json({
//             success: true,
//             message: type == 'delete' ? "Account deletion requested successfully" : "Account deletion cancelled successfully.",
//             delete_requested_at: date,
//             scheduled_deletion_date: type == 'delete' ? delete_requested_at : null,
//         });
//     } catch (err) {
//         return ctx.status(500).json({ success: false, message: "Something went wrong" });
//     }
// });
// !DOCS DONE
user_account.put('/update/change-password', async (ctx) => {
    const { role, oldPassword, newPassword } = await ctx.req.json();
    const { user_id, username, hashed, salt, email } = ctx.auth?.user_info || {};

    if (!user_id || !hashed || !salt) {
        return ctx.status(401).json({ success: false, message: "Unauthorized" });
    }

    // // Verify current password
    const { hash: hashedCurrentPassword } = await wrappedCryptoToken({
        wrappedCryptoString: oldPassword,
        salt: salt
    });
    if (hashed !== hashedCurrentPassword) {
        return ctx.status(400).json({ success: false, message: "Current password is incorrect." });
    }

    // // Check if new passwords match
    if (newPassword !== newPassword) {
        return ctx.status(400).json({ success: false, message: "New passwords do not match." });
    }

    // // Hash new password
    const { hash: newHash, salt: newSalt } = await wrappedCryptoToken({
        wrappedCryptoString: newPassword,
    });

    let { success, result } = await dbQuery(update(ctx.auth.table, {
        values: {
            hashed: newHash,
            salt: newSalt
        },
        where: `email = ${sanitize(email)}`
    }))

    if (!success) {
        return ctx.status(500).json({ success: false, message: "Password update failed. Please try again." });
    }
    // // Redirect to logout for re-authentication
    return ctx.json({ success: true, message: "Change password successfully." })
});

export default user_account;