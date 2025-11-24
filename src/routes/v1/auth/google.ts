import { getGoogleOAuthURL, GoogleOauthClient, verifyGoogleToken } from "@tezx/google-oauth2";
import { find, insert, sanitize } from "@tezx/sqlx/mysql";
import { Router } from "tezx";
import { setCookie } from "tezx/cookie";
import { BASE_URL, CLIENT_REDIRECT_URL, cookieDOMAIN } from "../../../config.js";
import { dbQuery, TABLES } from "../../../models/index.js";
import tokenEncodedCrypto from "../../../utils/crypto.js";
import { AppNotificationSendMessage } from "../../websocket/notification.js";

let google = new Router();
const ERROR_UI = (err: any) => `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Authentication Error</title>
<style>
body {
    font-family: Arial, sans-serif;
    background: #f8f9fd;
    margin: 0;
    display: flex;
    height: 100vh;
    justify-content: center;
    align-items: center;
}
.card {
    background: white;
    padding: 32px;
    max-width: 420px;
    border-radius: 16px;
    box-shadow: 0 8px 30px rgba(0,0,0,0.08);
    text-align: center;
    animation: slideDown .5s ease;
}
@keyframes slideDown {
    from { transform: translateY(-12px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
}
.icon {
    font-size: 60px;
    color: #e63946;
    margin-bottom: 16px;
}
.btn {
    padding: 12px 20px;
    display: inline-block;
    background: #e63946;
    color: white;
    text-decoration: none;
    border-radius: 10px;
    margin-top: 18px;
    font-weight: bold;
}
p {
    color: #555;
    font-size: 15px;
}
.title {
    font-size: 22px;
    margin-bottom: 8px;
    font-weight: bold;
}
</style>
</head>

<body>
<div class="card">
    <div class="icon">🚫</div>
    <div class="title">${err.title || "Authentication Error"}</div>
    <p>${err.reason || "Something went wrong during Google authentication."}</p>

    ${err.redirect
        ? `<a class="btn" href="${err.redirect}">${err.redirect_title || "Go Back"}</a>`
        : ""
    }
</div>
</body>
</html>
`;
const SUCCESS_UI = (token: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Login Successful</title>

<script>
setTimeout(() => {
    window.close();
}, 1800);
</script>

<style>
body {
    font-family: Arial, sans-serif;
    background: #eef7ff;
    margin: 0;
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
}
.card {
    background: white;
    padding: 32px;
    max-width: 420px;
    border-radius: 16px;
    box-shadow: 0 8px 30px rgba(0,0,0,0.08);
    text-align: center;
    animation: fadeIn .5s ease;
}
@keyframes fadeIn {
    from { opacity: 0; transform: scale(0.98); }
    to { opacity: 1; transform: scale(1); }
}
.icon {
    font-size: 60px;
    color: #1b9c85;
    margin-bottom: 16px;
}
p {
    color: #444;
    margin-top: 6px;
    font-size: 15px;
}
.title {
    font-size: 22px;
    font-weight: bold;
}
</style>
</head>

<body>
<div class="card">
    <div class="icon">✅</div>
    <div class="title">Login Successful</div>
    <p>Your Google account has been authenticated.</p>
    <p>You can close this window.</p>
</div>
</body>
</html>
`;

// 1. Initialize OAuth2 client
const client = GoogleOauthClient({
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET_ID!,
    redirectUri: `${BASE_URL}/v1/auth/google/callback`
});
// 2. Route to start Google login
google.get('/google/jump/*id', (ctx, next) => {
    const id = ctx?.req.params.id
    return getGoogleOAuthURL({
        authClient: client,
        state: id,
        scopes: ['openid', 'email', 'profile', 'phone'],
    })(ctx, next)
}, (ctx) => {
    return ctx.redirect(ctx.google.oauth_url);
});

export type EncryptAuthTypeComponent = "plan-selection" | "professional-profile" | "interest" | "otp" | "password" | "new-password" | "choose-team" | "student-profile" | "upload-document" | "review-account" | 'forget-password' | 'forget-typing-password';
export type EncryptAuthATypeFollow = 'account-create' | 'student' | "professional";
export type EncryptAuthAccountType = 'professional' | 'student';

export type EncryptAuthType = {
    s_id?: string,
    password?: string,
    account_type?: EncryptAuthAccountType,
    email: string,
    login_type: 'google' | 'email',
    is_verified?: boolean,
    otp?: string
    profile_info?: {
        fullname: string;
        username: string;
        college?: string;
        department?: string;
        instagram?: string;
        twitter?: string;
        github?: string;
        company?: string;
        email_verified?: boolean,
        job_role?: string;
        avatar_url?: string,
        linkedin?: string;
        discord?: string;
    }
    otp_tkn?: string,
    available: boolean,
    next: {
        type: EncryptAuthATypeFollow
        component: EncryptAuthTypeComponent
    }
}

// 3. Callback route, verify token and establish session
google.get('/google/callback', verifyGoogleToken({
    authClient: client,
    onError: (err, ctx) => {
        return ctx.redirect(CLIENT_REDIRECT_URL.error(err))
        // handle error or redirect
    },
    Callbacks: (ctx) => {
        return {
            signIn: async (user) => {
                let state = decodeURIComponent(ctx.req.query?.state as string);
                const [role, socket] = state?.split(":/");

                let { result, success } = await dbQuery(find(role === 'client' ? TABLES.CLIENTS.clients : TABLES.TRAINERS.trainers, {
                    where: `email = ${sanitize(user.email)}`,
                }));
                let findUser = result?.[0];
                if (success && findUser && findUser?.login_type !== 'google') {
                    ctx.error = {
                        title: "Account already exists with email/password login",
                        type: "error",
                        reason: "auth/account-exists-email",
                        redirect: CLIENT_REDIRECT_URL.auth(""),
                        redirect_title: "Login",
                        email: user.email,
                        next: {
                            type: "error",
                        }
                    }
                    return true;
                }
                else if (success && result && result?.length > 0) {
                    let tkn = await tokenEncodedCrypto({
                        account: user?.email,
                        hashed: user?.email,
                        data: { user_id: result?.[0]?.client_id ?? result?.[0]?.trainer_id, maxAge: 60 * 60 * 24 },
                        method: 'google',
                        role: role || 'user',
                    });
                    ctx.tkn = tkn;
                    AppNotificationSendMessage(ctx, {
                        socket_id: socket,
                        data: {
                            role: role,
                            token: tkn,
                            user: result?.[0],
                            type: "google",
                        }
                    })
                    setCookie(ctx, 's_id', tkn as string, {
                        httpOnly: true,
                        path: '/',
                        secure: true,
                        domain: cookieDOMAIN,
                        sameSite: 'Lax',
                        maxAge: 60 * 60 * 24 * 30, // 30 days
                    });
                    ctx.auth_url = CLIENT_REDIRECT_URL.account;
                    return true;
                }
                else {

                    let payload = {
                        email: user?.email,
                        login_type: "google",
                        fullname: user?.name,
                        avatar: user?.picture,
                        email_verified: 1
                    }
                    const sql = insert(role === 'client' ? TABLES.CLIENTS.clients : TABLES.TRAINERS.trainers, payload)
                    const { result, } = await dbQuery<any>(sql);
                    let tkn = await tokenEncodedCrypto({
                        account: user?.email,
                        hashed: user?.email,
                        data: { user_id: result?.insertId, maxAge: 60 * 60 * 24 },
                        method: 'google',
                        role: role || 'user',
                    });
                    ctx.tkn = tkn;
                    AppNotificationSendMessage(ctx, {
                        socket_id: socket,
                        data: {
                            token: tkn,
                            user: payload,
                            role: role,
                            type: "google",
                        }
                    })
                    return success;
                }
            },
        }
    }
}), async (ctx) => {
    const error = ctx.error;
    const token = ctx.tkn;
    if (error) {
        return ctx.html(ERROR_UI(error));
    } else {
        return ctx.html(SUCCESS_UI(token));
    }
});

export { google };

