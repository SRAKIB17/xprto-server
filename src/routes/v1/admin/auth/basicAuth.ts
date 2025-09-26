import { mysql_datetime } from "@dbnx/mysql";
import { Context, NextCallback } from "tezx";
import { deleteCookie, getCookie } from "tezx/helper";
import { basicAuth } from "tezx/middleware/basic-auth";
import { cookieDOMAIN } from "../../../../config.js";
import { db, table_schema } from "../../../../models/index.js";
import { wrappedCryptoToken } from "../../../../utils/crypto.js";
import { decrypt } from "../../../../utils/encrypted.js";

export async function AuthorizationControllerAdmin({ credentials = {}, ctx }: { ctx: Context, credentials?: any }) {
    let s_id = credentials?.token || getCookie(ctx, 's_id') || ctx.req.header("s_id");
    let { decrypted, success } = decrypt(s_id, process.env.CRYPTO_KEY!);
    if (success && decrypted) {
        try {
            let data = JSON.parse(decrypted);
            let account = data?.account;
            let session = data?.session;
            let method = data?.method;
            let admin_id = data?.data?.admin_id;
            let role = data?.role;
            let { result, error } = await db.update(table_schema.admins, {
                values: {
                    last_visit: mysql_datetime()
                },
                where: db.condition({ admin_id: admin_id }),
            }).findOne(table_schema.admins, {
                // joins: [
                //     {
                //         type: 'LEFT JOIN',
                //         table: table_schema.user_follows,
                //         on: 'user_details.user_id = user_follows.follower_id OR user_details.user_id = user_follows.following_id'
                //     },
                //     {
                //         type: 'LEFT JOIN',
                //         table: table_schema.documents,
                //         on: 'user_details.user_id = documents.user_id'
                //     },
                // ],
                columns: {
                    admins: ["*"],
                },
                where: db.condition({
                    email: account,
                })
            }).executeMultiple();
            if (result?.[1]?.length === 0) {
                return false;
            }

            let { hashed, salt, login_type, email } = result?.[1]?.[0];
            let [en_salt, en_hashed] = session.split('####');

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
export function AuthorizationMiddlewareAdmin() {
    return async (ctx: Context, next: NextCallback) => {
        const authHeader = ctx.req.header("authorization");
        let check = await AuthorizationControllerAdmin({
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
export function AuthorizationBasicAuthAdmin(onUnauthorized?: ((ctx: Context, error?: Error) => Response)) {
    return basicAuth({
        supportedMethods: ['bearer-token'],
        validateCredentials: async (method, credentials, ctx) => {
            return AuthorizationControllerAdmin({ credentials, ctx })
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