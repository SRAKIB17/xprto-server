import { mysql_datetime } from "@dbnx/mysql";
import { Context, NextCallback } from "tezx";
import { basicAuth } from "tezx/middleware/basic-auth";
import { db, table_schema } from "../../../models/index.js";
import { wrappedCryptoToken } from "../../../utils/crypto.js";
import { decrypt } from "../../../utils/encrypted.js";
import { cookieDOMAIN } from "../../../config.js";
import { deleteCookie, getCookie } from "tezx/helper";

export async function AuthorizationControllerUser({ credentials = {}, ctx }: { ctx: Context, credentials?: any }) {
    let s_id = credentials?.token || getCookie(ctx, 's_id') || ctx.req.header("s_id");
    let { decrypted, success } = decrypt(s_id, process.env.CRYPTO_KEY!);
    if (success && decrypted) {
        try {
            let data = JSON.parse(decrypted);
            let account = data?.account;
            let session = data?.session;
            let method = data?.method;
            let user_id = data?.data?.user_id;
            let role = data?.role;
            let { result, error } = await db.update(table_schema.user_details, {
                values: {
                    last_login: mysql_datetime()
                },
                where: db.condition({ user_id: user_id }),
            }).findOne(table_schema.user_details, {
                joins: [
                    // {
                    //     type: 'LEFT JOIN',
                    //     table: table_schema.user_follows,
                    //     on: 'user_details.user_id = user_follows.follower_id OR user_details.user_id = user_follows.following_id'
                    // },
                    {
                        type: 'LEFT JOIN',
                        table: table_schema.documents,
                        on: 'user_details.user_id = documents.user_id'
                    },
                    {
                        type: 'LEFT JOIN',
                        table: table_schema.doc_uploaded_files,
                        on: "doc_uploaded_files.doc_id = documents.doc_id"
                    },
                ],
                columns: {
                    user_details: ["*"],
                    extra: [
                        // 'COUNT(DISTINCT CASE WHEN user_follows.follower_id = user_details.user_id THEN user_follows.following_id END) AS total_following',
                        // 'COUNT(DISTINCT CASE WHEN user_follows.following_id = user_details.user_id THEN user_follows.follower_id END) AS total_followers',
                        // Subquery for total paper views for all the user's documents
                        // `(SELECT SUM(view_count) FROM ${table_schema.documents} WHERE user_id = user_details.user_id) AS paper_views`,
                        // Subquery for total reactions for all the user's documents
                        // `(SELECT SUM(reaction_count) FROM ${table_schema.documents} WHERE user_id = user_details.user_id) AS reaction_count`,
                        `COUNT(DISTINCT CASE WHEN doc_uploaded_files.visibility = 'PUBLIC' THEN documents.doc_id END) AS total_papers`, // Count total papers by user
                        `CONCAT(DAY(registered_at), ', ', MONTHNAME(registered_at), ', ', YEAR(registered_at)) AS joined`, // Format the join date
                        `
CASE
    WHEN user_details.delete_requested_at IS NOT NULL
        THEN DATE_ADD(user_details.delete_requested_at, INTERVAL 14 DAY)
    ELSE NULL
END AS scheduled_deletion_date
                        `
                    ]
                },
                groupBy: ['user_details.user_id'], // Group by user_id to get user-level data
                where: db.condition({
                    email: account,
                    login_type: method,
                })
            }).executeMultiple();
            if (result?.[1]?.length === 0) {
                return false;
            }

            let { hashed, salt, login_type, email } = result?.[1]?.[0];
            let [en_salt, en_hashed] = session.split('####');
            if (method == 'google') {
                hashed = email
            }

            let s = await wrappedCryptoToken({
                salt: en_salt,
                wrappedCryptoString: hashed,
            });
            if (s?.success && s?.hash === en_hashed) {
                ctx.auth = { success: true, user_info: result?.[1]?.[0], isLoggedIn: true, role: role }
                return true;
            }
            else {
                return false;
            }
        }
        catch (ero) {
            return false;
        }
    }
    else {
        return false;
    }
}

export function AuthorizationMiddlewarePublic() {
    return async (ctx: Context, next: NextCallback) => {
        const authHeader = ctx.req.header("authorization");
        await AuthorizationControllerUser({
            credentials: { token: authHeader?.startsWith("Bearer ") && authHeader?.split(" ")?.[1] },
            ctx: ctx,
        });

        return next();
    }
}

export function AuthorizationMiddlewareUser() {
    return async (ctx: Context, next: NextCallback) => {
        const authHeader = ctx.req.header("authorization");
        let check = await AuthorizationControllerUser({
            credentials: { token: authHeader?.startsWith("Bearer ") && authHeader?.split(" ")?.[1] },
            ctx: ctx,
        });
        if (!check) {
            return ctx.status(401).json({
                success: false,
                message: "Unauthorized access. Please log in.",
            });
        }
        return next();
    }
}
export function AuthorizationBasicAuthUser(onUnauthorized?: ((ctx: Context, error?: Error) => Response)) {
    return basicAuth({
        supportedMethods: ['bearer-token'],
        validateCredentials: async (method, credentials, ctx) => {
            return AuthorizationControllerUser({ credentials, ctx })
        },
        onUnauthorized(ctx, error) {
            deleteCookie(ctx, 's_id', {
                httpOnly: true,
                path: '/',
                secure: true,
                domain: cookieDOMAIN,
                sameSite: 'Lax',
            });
            if (onUnauthorized) {
                return onUnauthorized(ctx, error);
            }
            return ctx.status(401).json({
                success: false,
                message: 'Unauthorized',
            })
        },
    })
}