import { find, mysql_datetime, sanitize, update } from "@tezx/sqlx/mysql";
import { Context, NextCallback } from "tezx";
import { getCookie } from "tezx/cookie";
import { bearerAuth } from "tezx/middleware";
import { dbQuery, TABLES } from "../../../models/index.js";
import { wrappedCryptoToken } from "../../../utils/crypto.js";
import { decrypt } from "../../../utils/encrypted";

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


            // Fetch user from DB
            let table = TABLES.CLIENTS.clients;
            let joins: string | undefined = undefined;
            joins = `
            LEFT JOIN ${TABLES.CLIENTS.CLIENT_GYM_MEMBERSHIPS} as cgm ON cgm.client_id = us.client_id
            LEFT JOIN ${TABLES.GYMS.PLANS} as pl ON pl.plan_id = cgm.plan_id
            `
            if (role === 'trainer') {
                table = TABLES.TRAINERS.trainers;
                joins = undefined;
            }
            if (role === 'gym') {
                joins = undefined;
                table = TABLES.GYMS.gyms
            }
            if (role === 'admin') {
                joins = `
                  LEFT JOIN ${TABLES.ADMIN.ROLE_PERMISSIONS} as r ON r.admin_id = us.admin_id
                  LEFT JOIN ${TABLES.ADMIN.PERMISSIONS} as p ON p.permission_id = r.permission_id
                `;
                table = TABLES.ADMIN.admin;
            }

            let updateSql = update(table, {
                values: {
                    last_visit: mysql_datetime()
                },
                where: `email = ${sanitize(account)}`,
            });
            const sql = find(`${table} as us`, {
                joins: joins,
                where: `email = ${sanitize(account)}`,
                columns: `
                us.* ${joins && role === 'client' ? `,
                    CASE
                    WHEN pl.is_pro_plan = 1
                    AND cgm.valid_to >= CURRENT_DATE()
                    THEN 1
                    ELSE 0
                    END AS is_pro
                    `:
                        joins && role === 'admin' ?
                            `,
            JSON_ARRAYAGG(
                JSON_OBJECT(
                    'permission_id', p.permission_id,
                    'permission_key', p.permission_key,
                    'can_view', r.can_view,
                    'can_create', r.can_create,
                    'can_update', r.can_update,
                    'can_delete', r.can_update
                )
            ) AS permissions
                        `
                            : ""
                    }
                    `,
                groupBy: (joins && role === 'client') ? 'us.client_id' : (
                    (joins && role === 'admin') ? 'us.admin_id' : undefined
                ),
                limitSkip: {
                    limit: 1
                }
            });
            const { success, result, error, } = await dbQuery<any>(`${updateSql}${sql}`);
            // 'COUNT(DISTINCT CASE WHEN user_follows.follower_id = user_details.user_id THEN user_follows.following_id END) AS total_following',
            //                         `COUNT(DISTINCT CASE WHEN doc_uploaded_files.visibility = 'PUBLIC' THEN documents.doc_id END) AS total_papers`, // Count total papers by user
            //                         `CONCAT(DAY(registered_at), ', ', MONTHNAME(registered_at), ', ', YEAR(registered_at)) AS joined`, // Format the join date
            //                         `
            // CASE
            //     WHEN user_details.delete_requested_at IS NOT NULL
            //         THEN DATE_ADD(user_details.delete_requested_at, INTERVAL 14 DAY)
            //     ELSE NULL
            // END AS scheduled_deletion_date
            if (result?.[1]?.length === 0) {
                return false;
            }

            let { hashed, salt, login_type, email } = result?.[1]?.[0]
            let [en_salt, en_hashed] = session.split('####');
            if (method == 'google') {
                hashed = email
            }
            let s = await wrappedCryptoToken({
                salt: en_salt,
                wrappedCryptoString: hashed,
            });
            if (s?.success && s?.hash === en_hashed) {
                ctx.auth = {
                    table: table,
                    success: true,
                    user_info: {
                        ...result?.[1]?.[0],
                        user_id: user_id,
                    },
                    isLoggedIn: true,
                    role: role
                }
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

export function AuthorizationBasicAuthUser() {
    return bearerAuth({
        validate: (token, ctx) => {
            return AuthorizationControllerUser({ credentials: { token: token }, ctx })
        },
        onUnauthorized(ctx, error) {
            // console.log(error)
            throw new Error("unauthorized");
        },
    })
}