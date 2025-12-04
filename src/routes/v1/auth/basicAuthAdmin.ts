
// import { find, mysql_datetime, sanitize, update } from "@tezx/sqlx/mysql";
// import { Context, NextCallback } from "tezx";
// import { getCookie } from "tezx/cookie";
// import { bearerAuth } from "tezx/middleware";
// import { dbQuery, TABLES } from "../../../models/index.js";
// import { wrappedCryptoToken } from "../../../utils/crypto.js";
// import { decrypt } from "../../../utils/encrypted.js";

// export async function AuthorizationControllerAdmin({ credentials = {}, ctx }: { ctx: Context, credentials?: any }) {
//     let s_id = credentials?.token || getCookie(ctx, 's_id') || ctx.req.header("s_id");
//     let { decrypted, success } = decrypt(s_id, process.env.CRYPTO_KEY!);
//     if (success && decrypted) {
//         try {
//             let data = JSON.parse(decrypted);
//             console.log(data)
//             let account = data?.account;
//             let session = data?.session;
//             let user_id = data?.data?.user_id;
//             let role = 'admin';
//             // Fetch user from DB
//             // const sql = find(TABLES.ADMIN.admin, {
//             //     where: `email = ${sanitize(email)}`,
//             //     
//             //     limitSkip: {
//             //         limit: 1
//             //     }
//             // })
//             // Fetch user from DB

//             let updateSql = update(TABLES.ADMIN.admin, {
//                 values: {
//                     last_visit: mysql_datetime()
//                 },
//                 where: `email = ${sanitize(account)}`,
//             });
//             const sql = find(`${TABLES.ADMIN.admin} as admin`, {
//                 joins: `
//                     LEFT JOIN ${TABLES.ADMIN.ROLE_PERMISSIONS} as r ON r.admin_id = admin.admin_id
//                     LEFT JOIN ${TABLES.ADMIN.PERMISSIONS} as p ON p.permission_id = r.permission_id
//                     `,
//                 where: `admin.email = ${sanitize(account)}`,
//                 groupBy: 'admin.admin_id',
//                 limitSkip: {
//                     limit: 1
//                 }
//             });

//             const { success, result, error, } = await dbQuery<any>(`${updateSql}${sql}`);

//             if (result?.[1]?.length === 0) {
//                 return false;
//             }

//             let { hashed } = result?.[1]?.[0]
//             let [en_salt, en_hashed] = session.split('####');

//             let s = await wrappedCryptoToken({
//                 salt: en_salt,
//                 wrappedCryptoString: hashed,
//             });
//             if (s?.success && s?.hash === en_hashed) {
//                 ctx.auth = {
//                     success: true,
//                     user_info: {
//                         ...result?.[1]?.[0],
//                         user_id: user_id,
//                     },
//                     isLoggedIn: true,
//                     role: 'admin'
//                 }
//                 return true;
//             }
//             else {
//                 return false;
//             }
//         }
//         catch (ero) {
//             return false;
//         }
//     }
//     else {
//         return false;
//     }
// }

// export function AuthorizationBasicAuthAdmin() {
//     return bearerAuth({
//         validate: (token, ctx) => {
//             return AuthorizationControllerAdmin({ credentials: { token: token }, ctx })
//         },
//         onUnauthorized(ctx, error) {
//             // console.log(error)
//             throw new Error("unauthorized");
//         },
//     })
// }