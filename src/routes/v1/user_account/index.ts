import { mysql_datetime, sanitize } from "@dbnx/mysql";
import fs, { existsSync, renameSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { Router } from "tezx";
import { useFormData } from "tezx/helper";
import { paginationHandler } from "tezx/middleware/pagination";
import { support_email } from "../../../config.js";
import { sendEmail } from "../../../email/mailer.js";
import { db, table_schema } from "../../../models/index.js";
import { wrappedCryptoToken } from "../../../utils/crypto.js";
import { AuthorizationMiddlewareUser } from "../auth/basicAuth.js";
import user_account_bookmark from "./bookmark.js";
import user_account_document_flag from "./flag-document.js";
const user_account = new Router();

user_account.use([AuthorizationMiddlewareUser(),
async (ctx, next) => {
    let user_id = ctx.auth?.user_info?.user_id || '';
    if (!ctx.auth || !user_id) {
        return ctx.status(401).json({
            success: false,
            message: "Unauthorized access. Please log in.",
        });
    }

    return await next()
}
]);
user_account.use(user_account_document_flag);
user_account.use(user_account_bookmark);

user_account.get('/follower-following',
    paginationHandler({
        countKey: 'count',
        defaultLimit: 9,
        queryKeyLimit: 'limit',
        maxLimit: 9,
        getDataSource: async (ctx, pagination) => {
            const user_id = ctx.auth?.user_info?.user_id || '';
            const { type } = ctx.req.query;

            const followings = await db.findAll(table_schema.user_follows, {
                joins: [
                    {
                        table: table_schema.user_details,
                        on: type == 'follower' ? 'user_details.user_id = user_follows.follower_id' : 'user_details.user_id = user_follows.following_id'
                    }
                ],
                columns: {
                    extra: [
                        // `Case when user_follows.`,
                        `(SELECT COUNT(*) FROM ${table_schema.user_follows} WHERE following_id = user_details.user_id AND follower_id = ${sanitize(user_id)}) as is_following`,
                        `(SELECT COUNT(*) FROM ${table_schema.user_follows} uf WHERE uf.follower_id = user_details.user_id) AS total_following`,
                        `(SELECT COUNT(*) FROM ${table_schema.user_follows} uf WHERE uf.following_id = user_details.user_id) AS total_followers`
                    ],
                    user_details: ['username', 'updated_at', 'fullname', 'avatar_url', 'user_id']
                },
                where: db.condition({
                    [type == 'follower' ? 'user_follows.following_id' : 'user_follows.follower_id']: user_id
                })
            }).findOne(table_schema.user_follows, {
                aggregates: [
                    {
                        COUNT: "*",
                        alias: 'count'
                    }
                ],
                joins: [
                    {
                        table: table_schema.user_details,
                        on: type == 'follower' ? 'user_details.user_id = user_follows.follower_id' : 'user_details.user_id = user_follows.following_id'
                    }
                ],
                where: db.condition({
                    [type == 'follower' ? 'user_follows.following_id' : 'user_follows.follower_id']: user_id
                })
            }).executeMultiple();
            return {
                data: followings?.result?.[0],
                count: followings?.result?.[1]?.[0]?.count
            }
        },
    }),
    async (ctx) => {
        return ctx.json(ctx.body);
    })

user_account.post('/report-someone/:profile_id', async (ctx) => {
    try {
        const user_id = ctx.auth?.user_info?.user_id;
        const profile_id = ctx.req.params?.profile_id;

        if (!user_id) {
            return ctx.status(401).json({ success: false, message: "Unauthorized" });
        }

        if (!profile_id) {
            return ctx.status(400).json({ success: false, message: "Profile ID is required" });
        }

        const { reason, additional_info } = await ctx.req.json();

        if (!reason) {
            return ctx.status(400).json({ success: false, message: "Reason is required" });
        }

        const { result, success } = await db.create(table_schema.profile_reports, {
            reason,
            additional_info: additional_info || null,
            reporter_user_id: user_id,
            reported_profile_id: profile_id,
        }).execute();

        if (!success) {
            return ctx.status(500).json({ success: false, message: "Failed to submit report" },);
        }
        return ctx.json({ success: true, message: "Report submitted successfully", result });
    }
    catch (error) {
        return ctx.status(500).json({ success: false, message: "Server error" });
    }
});

user_account.post('/following/:following_id', async (ctx) => {
    const following_id = ctx.req.params?.following_id;
    const follower_id = ctx.auth?.user_info?.user_id || '';

    if (!following_id || !follower_id || following_id === follower_id) {
        return ctx.status(400).json({
            success: false,
            message: "Invalid follow request.",
        });
    }
    const { success, result, error, errno } = await db.create(table_schema.user_follows, {
        follower_id,
        following_id
    }) // for following
        .update(table_schema.user_details, {
            setCalculations: {
                total_following: `total_following + 1`
            },
            where: db.condition({ user_id: follower_id })
        })
        // for follower
        .update(table_schema.user_details, {
            setCalculations: {
                total_followers: `total_followers + 1`
            },
            where: db.condition({ user_id: following_id })
        })
        .executeMultiple();

    if (result?.[0]?.affectedRows > 0) {
        return ctx.json({
            success: true,
            message: "Followed successfully.",
        });
    } else {
        if (errno == 1062) {
            return ctx.json({
                success: false,
                message: "You are already following this user.",
            });
        }
        return ctx.status(500).json({
            success: false,
            message: "Failed to follow user.",
            error: error || "Unknown error occurred",
        });
    }

})

user_account.post('/unfollow/:following_id', async (ctx) => {
    const following_id = ctx.req.params?.following_id;
    const follower_id = ctx.auth?.user_info?.user_id || '';

    if (!following_id || !follower_id || following_id === follower_id) {
        return ctx.status(400).json({
            success: false,
            message: "Invalid follow request.",
        });
    }

    const { success, result, error, errno } = await db.delete(table_schema.user_follows, {
        where:
            db.condition({
                follower_id,
                following_id
            })
    })
        // for following
        .update(table_schema.user_details, {
            setCalculations: {
                total_following: `GREATEST(total_following - 1, 0)`,
            },
            where: db.condition({ user_id: follower_id })
        })
        // for follower
        .update(table_schema.user_details, {
            setCalculations: {
                total_followers: `GREATEST(total_followers - 1, 0)`,
            },
            where: db.condition({ user_id: following_id })
        })
        .executeMultiple();

    if (result?.[0]?.affectedRows > 0) {
        return ctx.json({
            success: true,
            message: "Unfollow successfully.",
        });
    } else {
        return ctx.status(500).json({
            success: false,
            message: "Failed to unfollow user.",
            error: error || "Unknown error occurred",
        });
    }

})


user_account.put('/avatar-upload', async (ctx) => {
    const formData = await useFormData(ctx);
    const avatar = formData.avatar;
    let { user_id, username } = ctx.auth?.user_info

    if (!(avatar instanceof File)) {
        return ctx.status(400).json({ error: "Invalid file" });
    }
    const buffer = await avatar.arrayBuffer();
    const name = `${username}.webp`;
    const inputBuffer = Buffer.from(buffer);
    // Use username from session/auth, or fallback to UUID
    const outputPath = path.resolve("uploads/avatars", name);

    try {
        await sharp(inputBuffer)
            .resize(256, 256) // optional: resize to square avatar
            .webp({ quality: 85 })
            .toFile(outputPath);

        let { result, success } = await db.update(table_schema.user_details, {
            values: {
                'updated_at': mysql_datetime(),
                avatar_url: `/images/avatars/${username}`,
            },
            where: db.condition({ user_id: user_id })
        }).execute();
        if (!success) {
            throw new Error("Update Failed.")
        }
        return ctx.json({ success: true, name: name, avatar: `/images/avatars/${username}`, });
    } catch (error) {
        return ctx.status(500).json({ error: "Failed to process image" });
    }
});

user_account.delete('/avatar-remove', async (ctx) => {
    const { user_id, username, avatar_url } = ctx.auth?.user_info;
    const filePath = path.resolve("uploads/avatars", `${avatar_url ? path.basename(avatar_url) : username}.webp`);
    try {
        await fs.promises.unlink(filePath); // remove the file
        // update DB to clear avatar_url
        await db.update(table_schema.user_details, {
            values: {
                avatar_url: null,
                updated_at: mysql_datetime()
            },
            where: db.condition({ user_id })
        }).execute();
        return ctx.json({ success: true });
    } catch (error) {
        return ctx.status(500).json({ error: "Failed to remove avatar" });
    }
});

user_account.put('/update/public-info/:column', async (ctx) => {
    const column = ctx.req.params?.column;
    const { user_id, username } = ctx.auth?.user_info || {};
    // Validate allowed fields
    const allowedColumns = [
        "phone",
        "username",
        "fullname",
        "bio",

        "college",
        "department",
        "company",
        "job_role",
        "is_access_public",

        "interest",
        "instagram",
        "twitter",
        "github",
        "linkedin",
        "discord",
        "medium",
    ];

    if (!allowedColumns.includes(column)) {
        return ctx.status(400).json({ error: "Invalid field update." });
    }

    const body = await ctx.req.json();
    const newValue = body?.[column];

    try {
        let update: any = {
            [column]: newValue
        }
        if (column == 'username') {
            update = {
                username: newValue,
                avatar_url: `/images/avatars/${newValue}`
            }
        }
        if (column === 'interest') {
            update = {
                interest: JSON.stringify(newValue)
            }
        }
        const { success, result } = await db.update(table_schema.user_details, {
            values: {
                ...update,
                updated_at: mysql_datetime(),
            },
            where: db.condition({ user_id }),
        }).execute();

        if (success) {
            if (column == 'username') {
                try {
                    const oldPath = path.resolve("uploads/avatars", `${username}.webp`);
                    const newPath = path.resolve("uploads/avatars", `${body?.username}.webp`);
                    if (username !== body?.username && existsSync(oldPath)) {
                        renameSync(oldPath, newPath);
                    }
                } catch (error) {
                    console.error("Avatar rename failed:", error);
                }
            }
            return ctx.json({ success: true, result });
        } else {
            return ctx.status(500).json({ error: "Failed to update." });
        }
    } catch (error) {
        return ctx.status(500).json({ error: "Server error." });
    }
});

user_account.put("/delete-account", async (ctx) => {
    try {
        const { user_id, username, fullname } = ctx.auth?.user_info || {};
        const { type } = await ctx.req.json();
        if (!user_id) {
            return ctx.status(401).json({ success: false, message: "Unauthorized" },);
        }
        let date = type == 'delete' ? mysql_datetime() : null;
        const { success, result } = await db.update(table_schema.user_details, {
            values: {
                delete_requested_at: date,
            },
            where: db.condition({ user_id }),
        }).execute();

        if (!success) {
            return ctx.status(500).json({ success: false, message: type == 'delete' ? "Failed to update account deletion request" : "Failed to cancel delete request." });
        }
        let delete_requested_at = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
        if (type === 'delete') {
            await sendEmail({
                subject: "Your Account Deletion Request – PaperNxt",
                to: ctx.auth?.user_info?.email,
                templateName: "account-delete",
                templateData: {
                    name: fullname,
                    date: new Date(delete_requested_at).toDateString(),
                }
            });
        } else {
            await sendEmail({
                subject: "Your Account Deletion Request Has Been Cancelled – PaperNxt",
                to: ctx.auth?.user_info?.email,
                templateName: "account-delete-cancelled",
                templateData: {
                    name: fullname,
                    support_email: support_email
                }
            });
        }
        return await ctx.json({
            success: true,
            message: type == 'delete' ? "Account deletion requested successfully" : "Account deletion cancelled successfully.",
            delete_requested_at: date,
            scheduled_deletion_date: type == 'delete' ? delete_requested_at : null,
        });
    } catch (err) {
        return ctx.status(500).json({ success: false, message: "Something went wrong" });
    }
});
user_account.put('/update/change-password', async (ctx) => {
    const { currentPassword, newPassword, confirmPassword } = await ctx.req.json();

    const { user_id, username, hashed, salt } = ctx.auth?.user_info || {};

    if (!user_id || !hashed || !salt) {
        return ctx.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Verify current password
    const { hash: hashedCurrentPassword } = await wrappedCryptoToken({
        wrappedCryptoString: currentPassword,
        salt: salt
    });
    if (hashed !== hashedCurrentPassword) {
        return ctx.status(400).json({ success: false, message: "Current password is incorrect." });
    }

    // Check if new passwords match
    if (newPassword !== confirmPassword) {
        return ctx.status(400).json({ success: false, message: "New passwords do not match." });
    }

    // Hash new password
    const { hash: newHash, salt: newSalt } = await wrappedCryptoToken({
        wrappedCryptoString: newPassword,
    });

    // Update password in DB
    const { result, success } = await db.update(table_schema.user_details, {
        values: {
            hashed: newHash,
            salt: newSalt
        },
        where: db.condition({ user_id })
    }).execute();

    if (!success) {
        return ctx.status(500).json({ success: false, message: "Password update failed. Please try again." });
    }

    // Redirect to logout for re-authentication
    return ctx.json({ success: true, message: "Change password successfully." })
});

export default user_account;