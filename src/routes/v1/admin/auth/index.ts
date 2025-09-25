import { sanitize } from "@dbnx/mysql";
import { Router } from "tezx";
import { rateLimiter } from "tezx/middleware/rate-limiter";
import { sendEmail } from "../../../../email/mailer.js";
import { db, table_schema } from "../../../../models/index.js";
import tokenEncodedCrypto, { wrappedCryptoToken } from "../../../../utils/crypto.js";
import { decrypt, encrypt } from "../../../../utils/encrypted.js";
import { AuthorizationBasicAuthAdmin } from "./basicAuth.js";
import { cookieDOMAIN } from "../../../../config.js";
import { setCookie } from "tezx/helper";
import { getConnInfo } from "tezx/bun";
const auth = new Router();

auth.post('/resend-otp', [getConnInfo(), rateLimiter({
    maxRequests: 1,
    windowMs: 60 * 1000,
    onError: (ctx, retryAfter) => {
        ctx.setStatus = 429;
        return ctx.json({
            success: false,
            message: `Try again in ${retryAfter} seconds.`,
        });
    }
})]
    , async (ctx) => {
        console.log(ctx.req.remoteAddress)
        const body = await ctx.req.json();
        let { email } = body
        let otp = Math.floor(100000 + Math.random() * 900000).toString();
        console.log(otp)
        let success = await sendEmail({
            to: body?.email,
            templateName: 'admin-2fa-otp',
            subject: "[PaperNxt Admin Login] Your 2FA OTP Code (Valid for 5 Minutes)",
            templateData: {
                otp: otp,
            }
        });
        if (success) {
            const payload = JSON.stringify({
                email,
                otp: otp,
                exp: Date.now() + 5 * 60 * 1000 // 5 minutes from now
            });

            return ctx.json({
                success: true,
                otp_tkn: encrypt(payload, process.env.OTP_ENCRYPTION_KEY!).encrypted,
            });
        }
        else {
            return ctx.json({
                success: false,
                message: "Failed to send OTP. Please try again later.",
            });
        }
    })

auth.post('/verify-otp', async (ctx) => {
    const body = await ctx.req.json();
    let { email, otp, otp_tkn } = body;
    let { success, decrypted } = decrypt(otp_tkn, process.env.OTP_ENCRYPTION_KEY!);
    if (!success || decrypted !== otp) {
        return ctx.json({ success: false, message: 'Invalid OTP token' });
    }
    return ctx.json({
        success: true,
        message: 'OTP verified successfully',
        email: email,
        otp: otp,
        token: encrypt(email, process.env.OTP_ENCRYPTION_KEY!).encrypted,
    });
})

auth.post('/login', async (ctx) => {
    const body = await ctx.req.json();
    let { otp_tkn } = body;

    let { success, decrypted, } = decrypt(otp_tkn, process.env.OTP_ENCRYPTION_KEY!);
    try {
        const { email, exp, otp } = JSON.parse(decrypted || '{}');
        if (!email || !exp) {
            return ctx.json({ success: false, type: "Invalid", message: "Invalid or tampered token!" });
        }
        if (Date.now() > exp) {
            return ctx.json({
                type: "Link Expired",
                success: false, message: "Sorry, the otp token is expired.\n Please request a new one to continue."
            });
        }
        if (!success || body?.otp !== otp) {
            return ctx.json({ success: false, message: 'Invalid OTP token' });
        }


        let { result } = await db.findOne(table_schema.admins, {
            where: `email = ${sanitize(email)}`,
        }).execute();
        if (result.length > 0) {
            let { hashed, salt, admin_id, role } = result[0];
            let { hash: hashedPassword } = await wrappedCryptoToken({
                wrappedCryptoString: body?.password,
                salt: salt
            });
            // // console.log(await db.update(table_schema.admins, {
            // //     values: {
            // //         hashed: hashedPassword,
            // //         salt: salt,
            // //     },
            // //     where: db.condition({ admin_id: result?.[0]?.admin_id })
            // // }).execute())
            // console.log(hashedPassword, hashed, body)

            if (hashed === hashedPassword) {
                let tkn = await tokenEncodedCrypto({
                    account: email,
                    hashed: hashed,
                    data: { admin_id: admin_id },
                    role: role,
                });
                setCookie(ctx, 's_id', tkn as string, {
                    httpOnly: true,
                    path: '/',
                    secure: true,
                    domain: cookieDOMAIN,
                    sameSite: 'Lax',
                    maxAge: 60 * 60 * 24 * 30, // 30 days
                });

                return ctx.json({
                    success: true,
                    message: 'User logged in successfully',
                    s_id: tkn,
                })
            }
            else {
                return ctx.json({
                    success: false,
                    message: 'Invalid password',
                });
            }
        }
        else {
            return ctx.json({
                success: false,
                message: 'User not found',
            });
        }
    }
    catch {
        return ctx.json({
            type: "Invalid Token",
            success: false, message: "Invalid token format!"
        });
    }

    // const body = await ctx.req.json();
    //    
    // return ctx.json({
    //     success: true,
    //     message: 'OTP verified successfully',
    //     email: email,
    //     otp: otp,
    //     token: encrypt(email, process.env.OTP_ENCRYPTION_KEY!).encrypted,
    // });
})
auth.post('/refresh', AuthorizationBasicAuthAdmin(), async (ctx) => {
    let admin_id = ctx.auth?.user_info?.admin_id;
    let permissions = await db.findAll(table_schema.role_permissions, {
        joins: [
            {
                table: table_schema.admin_permissions,
                on: `admin_permissions.permission_id = role_permissions.permission_id`
            }, {
                table: table_schema.admins,
                on: `admins.admin_id = role_permissions.admin_id`
            }
        ],
        where: db.condition({
            "admins.admin_id": admin_id
        }),
        columns: {
            role_permissions: ["*"],
            admin_permissions: ["*"]

        }
    }).execute();
    let response = {
        ...(ctx.auth || {}),
        permissions: permissions?.result,
    };
    return await ctx.json(response);
})


export { auth as adminAuth };

