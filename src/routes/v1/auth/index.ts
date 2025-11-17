import { google } from "./google.js";
import { find, insert, sanitize } from "@tezx/sqlx/mysql";
import { Router } from "tezx";
import { getConnInfo } from "tezx/bun";
import { deleteCookie, setCookie } from "tezx/helper";
import rateLimiter from "tezx/middleware/rate-limiter";
import { CLIENT_REDIRECT_URL, cookieDOMAIN, DirectoryServe, filename, FORGET_PASSWORD_EXP, SITE_TITLE, support_email } from "../../../config.js";
import { sendEmailWithTemplate } from "../../../email/mailer.js";
import { dbQuery, TABLES } from "../../../models/index.js";
import tokenEncodedCrypto, { wrappedCryptoToken } from "../../../utils/crypto.js";
import { encrypt } from "../../../utils/encrypted.js";
import { copyFile } from "../../../utils/fileExists.js";
import { AuthorizationBasicAuthUser } from "./basicAuth.js";
const auth = new Router();

// ! all done ✅
auth.post('/join-gym', async (ctx) => {
    try {
        const body = await ctx.req.json();
        const {
            fullName, email, mobile, gymName, district, state,
            address, postalCode, clients, gymType, ownerPhoto, gymLogo
        } = body;

        // === Handle Owner Photo ===
        let avatar;
        if (ownerPhoto) {
            const success = await copyFile(ownerPhoto, DirectoryServe.avatar('gym', ownerPhoto), true);
            if (success) avatar = `/gym/${filename(ownerPhoto)}`;
        }

        // === Handle Gym Logo ===
        let logo_url;
        if (gymLogo) {
            const success = await copyFile(gymLogo, DirectoryServe.avatar('gym/logo', gymLogo), true);
            if (success) logo_url = `/gym/logo/${filename(gymLogo)}`;
        }

        // === Generate Random Password ===
        const randomPassword = Math.random().toString(36).slice(-8); // 8-char random password
        const { hash: hashed, salt } = await wrappedCryptoToken({
            wrappedCryptoString: randomPassword,
        });

        // === Prepare Gym Data ===
        const gymData = {
            fullname: fullName,
            email,
            phone: mobile,
            salt,
            hashed: hashed,
            gym_name: gymName,
            address,
            district,
            state,
            postal_code: postalCode,
            total_clients: clients,
            gym_type: gymType,
            avatar,
            logo_url,
        };

        // === Save to DB ===
        const { success: dbSuccess, result, error } = await dbQuery<any>(insert(TABLES.GYMS.gyms, gymData as any));
        if (!dbSuccess) {
            if (error?.errno === 1062) {
                return ctx.json({ success: false, message: 'Email already exists' });
            }
            if (error?.errno === 1452) {
                return ctx.json({ success: false, message: 'Invalid foreign key data' });
            }
            return ctx.json({ success: false, message: 'Failed to create account. Please try again!' });
        }

        // === Generate Email Verification Token ===
        const payload = JSON.stringify({
            email,
            role: 'gym',
            name: fullName,
            exp: Date.now() + 60 * 60_000 // 60 min expiry
        });

        const { success: encSuccess, encrypted } = encrypt(payload, process.env.OTP_ENCRYPTION_KEY!);

        if (!encSuccess) {
            console.error("Encryption failed for gym email verification:", payload);
            return ctx.json({
                success: false,
                message: "Something went wrong. Credentials could not be sent to your email. Please reset your password"
            });
        }

        const url = CLIENT_REDIRECT_URL.verify_email(encrypted as string);

        // === Send Email ===
        await sendEmailWithTemplate({
            to: email,
            templateName: 'join-as-gym',
            subject: `Your Gym Owner Account - ${SITE_TITLE}`,
            templateData: {
                name: fullName,
                email,
                password: randomPassword,
                verificationUrl: url,
                year: new Date().getFullYear(),
            },
        });
        // === Return Success Response ===
        return await ctx.json({
            success: true,
            message: "Gym registered successfully! Please check your email for login details.",
            tempPassword: randomPassword, // optional: return for dev/testing
            gymId: result.insertId,
        });

    } catch (err) {
        console.error("Join Gym Error:", err);
        return ctx.json({ success: false, message: "Failed to register gym" });
    }
});

// ! all done ✅
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

// !done ✅
auth.post('/login', async (ctx) => {
    try {
        const body = await ctx.req.json();
        let { email, password, keep = false, role } = body;

        // Fetch user from DB
        let table = TABLES.CLIENTS.clients;
        if (role === 'trainer') table = TABLES.TRAINERS.trainers;
        if (role === 'gym') table = TABLES.GYMS.gyms
        const sql = find(table, {
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
        const { hashed, salt, login_type, client_id, trainer_id, gym_id } = user;

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
                user_id: client_id ?? trainer_id ?? gym_id,
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

// !done ✅
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
// !done
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

// !done
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
auth.use(google)

export default auth;