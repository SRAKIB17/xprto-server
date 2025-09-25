import { sanitize } from "@dbnx/mysql";
import { getGoogleOAuthURL, GoogleOauthClient, verifyGoogleToken } from "@tezx/google-oauth2";
import { Router } from "tezx";
import { generateID, setCookie } from "tezx/helper";
import { BASE_URL, CLIENT_REDIRECT_URL, cookieDOMAIN } from "../../../config.js";
import { db, table_schema } from "../../../models/index.js";
import tokenEncodedCrypto from "../../../utils/crypto.js";
import { encrypt } from "../../../utils/encrypted.js";

let google = new Router();

// 1. Initialize OAuth2 client
const client = GoogleOauthClient({
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET_ID!,
    redirectUri: `${BASE_URL}/v1/auth/google/callback`
});
// 2. Route to start Google login
google.get('/google', [
    getGoogleOAuthURL({
        authClient: client,
        scopes: ['openid', 'email', 'profile', 'phone'],
    })
], (ctx) => {
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
                let { result: find, success } = await db.findAll(table_schema.user_details, {
                    where: `email = ${sanitize(user.email)}`,
                }).execute();
                let findUser = find?.[0];
                if (success && findUser && findUser?.login_type !== 'google') {
                    let { success: encSuccess, encrypted } = await encrypt(JSON.stringify({
                        title: "Account already exists with email/password login",
                        type: "error",
                        reason: "auth/account-exists-email",
                        redirect: CLIENT_REDIRECT_URL.auth(""),
                        redirect_title: "Login",
                        email: user.email,
                        next: {
                            type: "error",
                        }
                    }), process.env.NEXT_PUBLIC_ENCRYPTED_PASSWORD as string);

                    ctx.auth_url = CLIENT_REDIRECT_URL.auth(encrypted as string);
                    return true;
                }
                else if (success && find.length > 0) {
                    let tkn = await tokenEncodedCrypto({
                        account: user?.email,
                        hashed: user?.email,
                        data: { user_id: find?.[0]?.user_id },
                        method: 'google',
                        role: 'user',
                    });
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
                    let info: EncryptAuthType = {
                        email: user?.email,
                        login_type: 'google',
                        profile_info: {
                            email_verified: true,
                            fullname: user.name,
                            username: `${user.email?.split("@")?.[0]}${generateID()?.split('-')?.[0]}`,
                            avatar_url: user.picture
                        },
                        available: true,
                        next: {
                            type: "account-create",
                            component: 'choose-team'
                        },
                    }

                    let { success, encrypted } = await encrypt(JSON.stringify(info), process.env.NEXT_PUBLIC_ENCRYPTED_PASSWORD as string);
                    ctx.auth_url = CLIENT_REDIRECT_URL.auth(encrypted as string);
                    //     const { result, success: s } = await db.create(table_schema.user_details, {
                    //         email: user.email,
                    //         login_type: 'google',
                    //         phone: null,
                    //         email_verified: true,
                    //         fullname: user.name,
                    //         hashed: null,
                    //         salt: null,
                    //         username: `${user.email?.split("@")?.[0]}${generateID()?.split('-')?.[0]}`,
                    //         avatar_url: user.picture
                    //     }, {
                    //         onDuplicateUpdateFields: [
                    //             "email",
                    //             "login_type",
                    //             "phone",
                    //             "email_verified",
                    //             "fullname",
                    //             "hashed",
                    //             "salt",
                    //             "username",
                    //             "avatar_url",
                    //         ]
                    //     }).execute();
                    //     success = result?.affectedRows > 0 && s;
                    return success;
                }
            },
        }
    }
}), async (ctx) => {
    return ctx.redirect(ctx.auth_url)
});
export { google };

