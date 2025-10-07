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

import { find, insert, sanitize } from "@tezx/sqlx/mysql";
import { Router } from "tezx";
import { getConnInfo } from "tezx/bun";
import { deleteCookie, setCookie } from "tezx/helper";
import rateLimiter from "tezx/middleware/rate-limiter";
import { CLIENT_REDIRECT_URL, cookieDOMAIN, FORGET_PASSWORD_EXP, SITE_TITLE, support_email } from "../../../config.js";
import { sendEmailWithTemplate } from "../../../email/mailer.js";
import { dbQuery, TABLES } from "../../../models/index.js";
import tokenEncodedCrypto, { wrappedCryptoToken } from "../../../utils/crypto.js";
import { encrypt } from "../../../utils/encrypted.js";
import { AuthorizationBasicAuthUser } from "./basicAuth.js";
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


auth.post('/register', async (ctx) => {
    try {
        const body = await ctx.req.json();
        const {
            name,
            email,
            type,
            fullname,
            mobileNumber,
            healthGoal,
            emergencyContact,
            password,
            specialization,
            experience,
        } = body;

        // Generate hash and salt for password
        let { hash, salt } = await wrappedCryptoToken({
            wrappedCryptoString: password,
        });
        let account_type = type;
        let insertData: Record<string, any> = {};
        let table;
        if (type === "client") {
            insertData = {
                fullname,
                phone: mobileNumber,
                email,
                hashed: hash!,
                salt,
                health_goal: healthGoal || null,
                emergency_contact: emergencyContact || null,
                xprto: true as any,
                status: 'active',
            }
            table = TABLES.CLIENTS.clients;
        } else if (type === "trainer") {
            insertData = {
                fullname,
                phone: mobileNumber,
                email,
                hashed: hash,
                xprto: true as any,
                salt,
                specialization: specialization || null,
                experience_years: experience || null,
                status: 'active',
            };
            table = TABLES.TRAINERS.trainers;
        } else {
            return ctx.json({ success: false, message: 'Invalid account type' });
        }

        let sql = insert(table, insertData);

        let { success, result, error }: any = await dbQuery(sql!);
        if (success && result?.affectedRows > 0) {
            // Generate session token
            let tkn = await tokenEncodedCrypto({
                account: email,
                data: {
                    [type == 'trainer' ? "trainer_id" : "client_id"]: result.insertId,
                    maxAge: 60 * 60 * 24 * 30, // 30 days
                },
                method: 'email',
                hashed: hash,
                role: type,

            });
            // Set cookie
            setCookie(ctx, 's_id', tkn!, {
                httpOnly: true,
                secure: true,
                path: '/',
                domain: cookieDOMAIN,
                sameSite: 'Lax',
                maxAge: 60 * 60 * 24 * 30, // 30 days
            });
            return ctx.json({
                user_info: insertData,
                success: true,
                account_type,
                message: 'User created successfully',
                s_id: tkn,
            });
        }
        else {
            if (error?.errno === 1062) {
                return ctx.json({
                    success: false,
                    message: 'Email already exists',
                });
            }
            if (error?.errno === 1452) {
                return ctx.json({
                    success: false,
                    message: 'Invalid foreign key data',
                });
            }
            return ctx.json({
                success: false,
                message: 'Failed to create account. Please try again!',
            });
        }
    } catch (err: any) {
        return ctx.json({
            success: false,
            message: 'Internal server error',
            error: err.message,
        });
    }
});

auth.post('/login', async (ctx) => {
    try {
        const body = await ctx.req.json();
        let { email, password, keep = false, role } = body;

        // Fetch user from DB
        const sql = find(role === 'trainer' ? TABLES.TRAINERS.trainers : TABLES.CLIENTS.clients, {
            where: `email = ${sanitize(email)}`,
            limitSkip: {
                limit: 1
            }
        })
        const { success, result } = await dbQuery(sql);
        if (!result || result.length === 0) {
            return ctx.json({ success: false, message: 'User not found' });
        }

        const user = result[0];
        const { hashed, salt, login_type, client_id, trainer_id } = user;

        if (login_type === 'google') {
            return ctx.json({
                success: false,
                message: "Email already in use. Please log in with Google."
            });
        }

        // Verify password
        const { hash: hashedPassword } = await wrappedCryptoToken({
            wrappedCryptoString: password,
            salt,
        });

        if (hashed !== hashedPassword) {
            return ctx.json({ success: false, message: 'Invalid password' });
        }

        // Generate session token
        const tkn = await tokenEncodedCrypto({
            account: email,
            method: 'email',
            hashed,
            data: {
                [client_id ? "client_id" : "trainer_id"]: client_id ?? trainer_id,
                maxAge: keep ? 60 * 60 * 24 * 30 : 60 * 60 * 24, // 30 days or 1 day
            },
            role: role || 'user',
        });
        // Set cookie

        setCookie(ctx, 's_id', tkn!, {
            httpOnly: true,
            secure: true,
            path: '/',
            domain: cookieDOMAIN,
            sameSite: 'Lax',
            maxAge: keep ? 60 * 60 * 24 * 30 : 60 * 60 * 24, // 30 days or 1 day
        });

        return ctx.json({
            success: true,
            message: 'User logged in successfully',
            s_id: tkn,
            user_info: user,
        });
    } catch (err: any) {
        console.error("Login Error:", err);
        return ctx.json({
            success: false,
            message: 'Internal server error',
            error: err.message,
        });
    }
});


auth.post('/refresh', AuthorizationBasicAuthUser(), async (ctx) => {
    return ctx.json(ctx.auth || {})
})


let passwordReset = new Map();

auth.post('/password-reset', [getConnInfo(), async (ctx, next) => {
    let { email, role } = await ctx.req.json();
    const { success, result: user } = await dbQuery(find(role === 'trainer' ? TABLES.TRAINERS.trainers : TABLES.CLIENTS.clients, {
        where: `email = ${sanitize(email)}`,
        limitSkip: {
            limit: 1
        }
    }))

    if (!user || user.length === 0) {
        return ctx.json({
            success: false, message: "Email not registered. Please sign up first."
        })
    }

    let { login_type } = user?.[0];
    if (login_type == 'google') {
        return ctx.json({ success: false, message: "Email already in use. Please log in with Google." });
    }
    ctx.forget_password = { email, fullname: user?.[0]?.fullname, role: role }

    return await rateLimiter({
        maxRequests: 1,
        windowMs: 60_000, // 1 min (rate limit settings)
        onError: (ctx, r, error) => {
            return ctx.json({ success: false, message: error?.message });
        },
        storage: {
            get: (key) => passwordReset.get(key),
            set: (key, value) => passwordReset.set(key, value),
            clearExpired: () => {
                const now = Date.now();
                for (const [key, entry] of passwordReset.entries()) {
                    if (now >= entry.resetTime) {
                        passwordReset.delete(key);
                    }
                }
            }
        },
    })(ctx, next) as Response;

}], async (ctx) => {
    let { email, fullname, role } = ctx.forget_password;

    // Add expiry time (now + 5 minutes)
    const payload = JSON.stringify({
        email,
        role: role,
        name: fullname,
        exp: Date.now() + FORGET_PASSWORD_EXP // 5 minutes from now
    });

    let { success, encrypted } = encrypt(payload, process.env.OTP_ENCRYPTION_KEY!);
    if (!success) {
        return ctx.json({ success: false, message: "Something went wrong. Please try again!" });
    }

    let url = CLIENT_REDIRECT_URL.reset_password(encrypted as string);

    let check = await sendEmailWithTemplate({
        to: email,
        templateName: 'reset-password',
        subject: `Reset Your Password - ${SITE_TITLE}`,
        templateData: {
            name: fullname,
            resetUrl: url,
        }
    });

    if (check) {
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


let emailVerifiedStorage = new Map();

auth.post('/send-verification-email', [
    getConnInfo(),
    async (ctx, next) => {
        // request থেকে email আর role বের করা
        let { email, role } = await ctx.req.json();
        const { success, result: user } = await dbQuery(
            find(
                role === 'trainer' ? TABLES.TRAINERS.trainers : TABLES.CLIENTS.clients,
                {
                    where: `email = ${sanitize(email)}`,
                    limitSkip: { limit: 1 }
                }
            )
        );

        if (!user || user.length === 0) {
            return ctx.json({
                success: false,
                message: "Email not registered. Please sign up first."
            });
        }

        let { login_type, fullname, email_verified } = user?.[0];

        if (login_type === 'google') {
            return ctx.json({
                success: false,
                message: "Email already in use. Please log in with Google."
            });
        }

        if (email_verified) {
            return ctx.json({
                success: false,
                message: "Email is already verified."
            });
        }

        // attach context
        ctx.email_verification = { email, fullname, role };

        // rate limiter
        return await rateLimiter({
            maxRequests: 1,
            windowMs: 60_000, // 1 min
            onError: (ctx, r, error) => {
                return ctx.json({ success: false, message: error?.message });
            },
            storage: {
                get: (key) => emailVerifiedStorage.get(key),
                set: (key, value) => emailVerifiedStorage.set(key, value),
                clearExpired: () => {
                    const now = Date.now();
                    for (const [key, entry] of emailVerifiedStorage.entries()) {
                        if (now >= entry.resetTime) emailVerifiedStorage.delete(key);
                    }
                }
            }
        })(ctx, next) as Response;
    }],
    async (ctx) => {
        const { email, fullname, role } = ctx.email_verification;

        // email verification token (expiry 10 min)
        const payload = JSON.stringify({
            email,
            role,
            name: fullname,
            exp: Date.now() + 10 * 60_000 // 10 min
        });

        const { success, encrypted } = encrypt(payload, process.env.OTP_ENCRYPTION_KEY!);

        if (!success) {
            return ctx.json({ success: false, message: "Something went wrong. Please try again!" });
        }

        const url = CLIENT_REDIRECT_URL.verify_email(encrypted as string);

        const check = await sendEmailWithTemplate({
            to: email,
            templateName: 'verify-email',
            subject: `Verify Your Email - ${SITE_TITLE}`,
            templateData: { name: fullname, verificationUrl: url }
        });

        if (check) {
            return ctx.json({
                success: true,
                message: `Thank you! A verification email has been sent. If you don’t get the email, please contact ${support_email}`
            });
        }

        return ctx.json({
            success: false,
            message: "Something went wrong. Please try again!"
        });
    }
);


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
    if (!next) {
        return ctx.json({ success: true, })
    }
    if (next === 'app') return ctx.json({ success: true })
    return ctx.redirect(next as string);
})
// auth.use(google)
export default auth;