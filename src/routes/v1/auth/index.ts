// import { sanitize } from "@dbnx/mysql";
// import { Router } from "tezx";
// import { getConnInfo } from "tezx/bun";
// import { deleteCookie, setCookie } from "tezx/helper";
// import { rateLimiter } from "tezx/middleware/rate-limiter";
// import { CLIENT_REDIRECT_URL, CLIENT_URL, cookieDOMAIN, FORGET_PASSWORD_EXP, support_email } from "../../../config.js";
// import { sendEmail } from "../../../email/mailer.js";
// import { db, table_schema } from "../../../models/index.js";
// import tokenEncodedCrypto, { wrappedCryptoToken } from "../../../utils/crypto.js";
// import { decrypt, encrypt } from "../../../utils/encrypted.js";
// import { AuthorizationBasicAuthUser } from "./basicAuth.js";
// import { google } from "./google.js";

import { Router } from "tezx";
import { getConnInfo } from "tezx/bun";

const auth = new Router();

// auth.post('/email-availability', async (ctx) => {
//     const body = await ctx.req.json();
//     let { result } = await db.findAll(table_schema.user_details, {
//         where: `email = ${sanitize(body.email)}`,
//     }).execute();
//     if (result?.length > 0) {
//         let { login_type } = result?.[0];
//         if (login_type == 'google') {
//             return ctx.json({ success: false, message: "Email already in use. Please log in with Google." });
//         }
//         return ctx.json({ success: true, available: false });
//     }
//     let otp = Math.floor(100000 + Math.random() * 900000).toString();

//     let success = await sendEmail({
//         to: body?.email,
//         templateName: 'register-otp',
//         subject: "PaperNxt OTP for Registration (Valid for 20 Minutes)",
//         templateData: {
//             otp: otp,
//         }
//     });

//     if (success) {
//         const payload = JSON.stringify({
//             email: body?.email,
//             otp,
//             exp: Date.now() + FORGET_PASSWORD_EXP // 5 minutes from now
//         });

//         let tkn = encrypt(payload, process.env.OTP_ENCRYPTION_KEY!).encrypted;
//         return ctx.json({
//             success: true,
//             available: true,
//             otp_tkn: tkn,
//         });
//     }
//     else {
//         return ctx.json({
//             success: false,
//             message: "Failed to send OTP. Please try again later.",
//         });
//     }
// });

// auth.post('/resend-otp', [getConnInfo(), rateLimiter({
//     maxRequests: 1,
//     windowMs: 60 * 1000,
//     onError: (ctx, retryAfter) => {
//         ctx.setStatus = 429;
//         return ctx.json({
//             success: false,
//             message: `Try again in ${retryAfter} seconds.`,
//         });
//     }
// })], async (ctx) => {
//     const body = await ctx.req.json();
//     let { email } = body
//     let otp = Math.floor(100000 + Math.random() * 900000).toString();

//     let success = await sendEmail({
//         to: email,
//         templateName: 'register-otp',
//         subject: "PaperNxt OTP for Registration (Valid for 20 Minutes)",
//         templateData: {
//             otp: otp,
//         }
//     });
//     if (success) {
//         const payload = JSON.stringify({
//             email,
//             otp,
//             exp: Date.now() + FORGET_PASSWORD_EXP // 5 minutes from now
//         });

//         let tkn = encrypt(payload, process.env.OTP_ENCRYPTION_KEY!).encrypted;
//         return ctx.json({
//             success: true,
//             otp_tkn: tkn,
//         });
//     }
//     else {
//         return ctx.json({
//             success: false,
//             message: "Failed to send OTP. Please try again later.",
//         });
//     }
// })

// auth.post('/verify-otp', async (ctx) => {
//     const body = await ctx.req.json();
//     let { email, otp, otp_tkn } = body;
//     let { success, decrypted } = decrypt(otp_tkn, process.env.OTP_ENCRYPTION_KEY!);
//     const { exp, otp: decrypted_otp } = JSON.parse(decrypted || '{}');
//     if (!email || !exp) {
//         return ctx.json({ success: false, type: "Invalid", message: "Invalid or tampered token!" });
//     }

//     if (Date.now() > exp) {
//         return ctx.json({
//             type: "Link Expired",
//             success: false, message: "Sorry, this password reset link has expired.\n Please request a new one to continue."
//         });
//     }
//     if (!success || decrypted_otp !== otp) {
//         return ctx.json({ success: false, message: 'Invalid OTP token' });
//     }
//     return ctx.json({
//         success: true,
//         message: 'OTP verified successfully',
//         email: email,
//         otp: otp,
//         token: encrypt(email, process.env.OTP_ENCRYPTION_KEY!).encrypted,
//     });
// })

// auth.get('/check-username/:username', async (ctx) => {
//     let username = ctx.req.params.username;
//     let { result } = await db.findOne(table_schema.user_details, {
//         where: `username = ${sanitize(username)}`,
//     }).execute();
//     if (result.length > 0) {
//         return ctx.json({ available: false });
//     }
//     return ctx.json({
//         available: true,
//         message: 'Username is available',
//     });
// })

// export type EncryptAuthType = {
//     password: string,
//     account_type: string,
//     email: string,
//     is_verified?: boolean,
//     otp?: string
//     login_type: 'google' | 'email',
//     profile_info: {
//         fullname: string;
//         username: string;
//         college?: string;
//         department?: string;
//         instagram?: string;
//         twitter?: string;
//         github?: string;
//         company?: string;
//         email_verified?: boolean,
//         job_role?: string;
//         avatar_url?: string,
//         linkedin?: string;
//         discord?: string;
//     }
//     otp_tkn?: string,
//     available: boolean,
// }


// auth.post('/register', async (ctx) => {
//     const body = await ctx.req.json();
//     let { email, account_type, login_type, profile_info: { avatar_url, college, email_verified, department, fullname, instagram, username, company, discord, github, job_role, linkedin, twitter }, password, is_verified } = body as EncryptAuthType;

//     if (is_verified || email_verified) {
//         let { hash, salt } = await wrappedCryptoToken({
//             wrappedCryptoString: password,
//         })

//         let { success, result, error, errno } = await db.create(table_schema.user_details, {
//             email: email,
//             college: college,
//             department: department,
//             fullname: fullname,
//             avatar_url: avatar_url,
//             instagram: instagram,
//             username: (typeof username === 'object' ? (username as any).value : username)?.toLowerCase(),
//             company: company,
//             login_type: login_type == 'google' ? 'google' : 'email',
//             hashed: login_type == 'google' ? null : hash,
//             salt: login_type == 'google' ? null : salt,
//             account_type: account_type,
//             email_verified: true,
//             discord: discord,
//             github: github,
//             job_role: job_role,
//             linkedin: linkedin,
//             twitter: twitter,
//         }).execute();

//         if (success && result && result.affectedRows > 0) {
//             let tkn = await tokenEncodedCrypto({
//                 account: email,
//                 data: { user_id: result?.insertId },
//                 method: login_type == 'google' ? 'google' : 'email',
//                 hashed: login_type == 'google' ? email : hash,
//                 role: 'user',
//             });
//             setCookie(ctx, 's_id', tkn as string, {
//                 httpOnly: true,
//                 secure: true,
//                 path: '/',
//                 domain: cookieDOMAIN,
//                 sameSite: 'Lax',
//                 maxAge: 60 * 60 * 24 * 30, // 30 days     
//             });
//             return ctx.json({
//                 success: true,
//                 account_type,
//                 message: 'User created successfully',
//                 s_id: tkn,
//             })
//         }
//         else {
//             if (errno === 1062) {
//                 return ctx.json({
//                     success: false,
//                     message: 'Email already exists',
//                 });
//             }
//             if (errno === 1452) {
//                 return ctx.json({
//                     success: false,
//                     message: 'Invalid data',
//                 });
//             }
//             return ctx.json({
//                 success: false, error: 'Please try again! Internal server error',
//             });
//         }
//     }
//     else {
//         return ctx.json({ success: false, message: 'Email not verified' });
//     }
// })

auth.post('/login', async (ctx) => {
    const body = await ctx.req.json();
    let { email, password } = body;
    // let { result } = await db.findOne(table_schema.user_details, {
    //     where: `email = ${sanitize(email)}`,
    // }).execute();
    // if (result.length > 0) {

    //     let { hashed, salt, login_type, user_id } = result[0];
    //     if (login_type == 'google') {
    //         return ctx.json({ success: false, message: "Email already in use. Please log in with Google." });
    //     }

    //     let { hash: hashedPassword } = await wrappedCryptoToken({
    //         wrappedCryptoString: password,
    //         salt: salt
    //     });
    //     if (hashed === hashedPassword) {
    //         let tkn = await tokenEncodedCrypto({
    //             account: email,
    //             method: 'email',
    //             hashed: hashed,
    //             data: { user_id: user_id },
    //             role: 'user',
    //         });
    //         setCookie(ctx, 's_id', tkn as string, {
    //             httpOnly: true,
    //             path: '/',
    //             secure: true,
    //             domain: cookieDOMAIN,
    //             sameSite: 'Lax',
    //             maxAge: 60 * 60 * 24 * 30, // 30 days
    //         });

    //         return ctx.json({
    //             success: true,
    //             message: 'User logged in successfully',
    //             s_id: tkn,
    //         })
    //     }
    //     else {
    //         return ctx.json({
    //             success: false,
    //             message: 'Invalid password',
    //         });
    //     }
    // }
    // else {
    return ctx.json({
        success: false,
        message: 'User not found',
    });
    // }
})

// auth.post('/refresh', AuthorizationBasicAuthUser(), async (ctx) => {
//     return ctx.json(ctx.auth || {})
// })


let documentPublicStorage = new Map();

auth.post('/password-reset', [getConnInfo(), async (ctx, next) => {
    let { email } = await ctx.req.json();
    let { result: user } = await db.findOne(table_schema.user_details, {
        where: db.condition({ email })
    }).execute();

    if (!user || user.length === 0) {
        return ctx.json({
            success: false, message: "Email not registered. Please sign up first."
        })
    }

    let { login_type } = user?.[0];
    if (login_type == 'google') {
        return ctx.json({ success: false, message: "Email already in use. Please log in with Google." });
    }
    ctx.forget_password = { email, fullname: user?.[0]?.fullname }

    return await rateLimiter({
        maxRequests: 1,
        windowMs: 60_000, // 1 min (rate limit settings)
        onError: (ctx, r, error) => {
            return ctx.json({ success: false, message: error?.message });
        },
        storage: {
            get: (key) => documentPublicStorage.get(key),
            set: (key, value) => documentPublicStorage.set(key, value),
            clearExpired: () => {
                const now = Date.now();
                for (const [key, entry] of documentPublicStorage.entries()) {
                    if (now >= entry.resetTime) {
                        documentPublicStorage.delete(key);
                    }
                }
            }
        },
    })(ctx, next) as Response;

}], async (ctx) => {

    let { email, fullname } = ctx.forget_password;
    // Add expiry time (now + 5 minutes)
    const payload = JSON.stringify({
        email,
        name: fullname,
        exp: Date.now() + FORGET_PASSWORD_EXP // 5 minutes from now
    });

    let { success, encrypted } = encrypt(payload, process.env.OTP_ENCRYPTION_KEY!);
    if (!success) {
        return ctx.json({ success: false, message: "Something went wrong. Please try again!" });
    }

    let url = CLIENT_REDIRECT_URL.reset_password(encrypted as string);

    let x = await sendEmail({
        to: email,
        templateName: 'reset-password',
        subject: "Reset Your Password - PaperNxt",
        templateData: {
            name: fullname,
            resetUrl: url,
        }
    });


    if (x) {
        return ctx.json({
            success: true,
            message: `Thank you! An email was sent that will ask you to verify that you own this account. If you don’t get the email, please contact ${support_email}`
        });
    }
    return ctx.json({
        success: false,
        message: `Something went wrong. Please try again!`
    });
});

auth.post('/password-reset-verify', async (ctx) => {
    let { tkn } = await ctx.req.json();

    let { success, decrypted } = decrypt(tkn?.replaceAll(" ", "+"), process.env.OTP_ENCRYPTION_KEY!);
    if (!success) {
        return ctx.json({ success: false, type: 'Internal Server Error', message: "Something went wrong. Please try again!" });
    }

    try {
        const { email, exp, name } = JSON.parse(decrypted || '{}');

        if (!email || !exp) {
            return ctx.json({ success: false, type: "Invalid", message: "Invalid or tampered token!" });
        }

        if (Date.now() > exp) {
            return ctx.json({
                type: "Link Expired",
                success: false, message: "Sorry, this password reset link has expired.\n Please request a new one to continue."
            });
        }

        return ctx.json({
            success: true,
            email,
            tkn,
        });

    } catch (error) {
        return ctx.json({
            type: "Invalid Token",
            success: false, message: "Invalid token format!"
        });
    }
});

auth.put('/password-reset-update', async (ctx) => {
    const { tkn, email, confirmPassword, newPassword, name } = await ctx.req.json();

    // Check if token is valid
    let { success, decrypted } = decrypt(tkn?.replaceAll(" ", "+"), process.env.OTP_ENCRYPTION_KEY!);
    if (!success) {
        return ctx.json({ success: false, type: 'InvalidToken', message: "The reset token is invalid or expired." });
    }

    // Check if new password and confirmation match
    if (confirmPassword !== newPassword) {
        return ctx.json({ success: false, type: 'PasswordMismatch', message: "Passwords do not match." });
    }

    // Optional: validate email format or existence here
    let { result: user } = await db.findOne(table_schema.user_details, {
        where: db.condition({ email })
    }).execute();

    if (!user || user.length === 0) {
        return ctx.json({ success: false, type: 'UserNotFound', message: "No account associated with this email." });
    }
    let { hash, salt } = await wrappedCryptoToken({
        wrappedCryptoString: newPassword,
    })

    await sendEmail({
        to: email,
        templateName: 'password-reset-success',
        subject: "Password Updated Successfully - PaperNxt",
        templateData: {
            name: name,
        }
    });

    let { success: passwordSuccess, result, error, errno } = await db.update(table_schema.user_details, {
        values: {
            hashed: hash,
            salt: salt,
        },
        where: db.condition({ email })
    }).execute();
    if (passwordSuccess && result && result.affectedRows > 0) {
        return ctx.json({ success: true, message: "Your password has been successfully updated." });
    }
    else {
        return ctx.json({ success: false, message: "Failed to update your password. Please try again." });
    }
});


auth.get('/logout', async (ctx) => {
    const next = ctx.req.query?.next;
    deleteCookie(ctx, 's_id', {
        httpOnly: true,
        path: '/',
        secure: true,
        domain: cookieDOMAIN,
        sameSite: 'Lax',
    });
    return ctx.redirect(next ? next : CLIENT_URL)
})
// auth.use(google)
export default auth;