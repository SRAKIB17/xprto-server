// import { mysql_datetime } from "@dbnx/mysql";
// import { Context, NextCallback } from "tezx";
// import { deleteCookie, getCookie } from "tezx/helper";
// import { basicAuth } from "tezx/middleware/basic-auth";
// import { cookieDOMAIN } from "../../../config.js";
// import { db, table_schema } from "../../../models/index.js";
// import { wrappedCryptoToken } from "../../../utils/crypto.js";
// import { decrypt } from "../../../utils/encrypted.js";

import { Context, NextCallback, TezXError } from "tezx";
import { getCookie } from "tezx/helper";
import { basicAuth, bearerAuth } from "tezx/middleware";
import { decrypt } from "../../../utils/encrypted";
import { find, mysql_datetime, sanitize, update } from "@tezx/sqlx/mysql";
import { dbQuery, TABLES } from "../../../models/index.js";
import { wrappedCryptoToken } from "../../../utils/crypto.js";

export async function AuthorizationControllerUser({ credentials = {}, ctx }: { ctx: Context, credentials?: any }) {
    let s_id = credentials?.token || getCookie(ctx, 's_id') || ctx.req.header("s_id");
    let { decrypted, success } = decrypt(s_id, process.env.CRYPTO_KEY!);
    if (success && decrypted) {
        try {
            let data = JSON.parse(decrypted);
            let account = data?.account;
            let session = data?.session;
            let method = data?.method;
            let user_id = data?.data?.client_id || data?.data?.trainer_id;
            let role = data?.role;
            let table = role === 'trainer' ? TABLES.TRAINERS.trainers : TABLES.CLIENTS.clients;

            let updateSql = update(table, {
                values: {
                    last_visit: mysql_datetime()
                },
                where: `email = ${sanitize(account)}`,
            });
            const sql = find(table, {
                where: `email = ${sanitize(account)}`,
                limitSkip: {
                    limit: 1
                }
            })
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
            if (result?.[1]?.[0]?.length === 0) {
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
    return bearerAuth({
        validate: (token, ctx) => {
            return AuthorizationControllerUser({ credentials: { token: token }, ctx })
        },
        onUnauthorized(ctx, error) {
            throw TezXError.unauthorized();
        },
    })
}