import { getGoogleOAuthURL, GoogleOauthClient, verifyGoogleToken } from "@tezx/google-oauth2";
import { Router } from "tezx";
import { generateID, setCookie } from "tezx/helper";
import { BASE_URL, CLIENT_REDIRECT_URL, cookieDOMAIN } from "../../../config.js";
import tokenEncodedCrypto from "../../../utils/crypto.js";
import { encrypt } from "../../../utils/encrypted.js";
import { find, sanitize } from "@tezx/sqlx/mysql";
import { dbQuery, TABLES } from "../../../models/index.js";

let google = new Router();

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
                        data: { user_id: result?.[0]?.user_id, maxAge: 60 * 60 * 24 },
                        method: 'google',
                        role: role || 'user',
                    });
                    ctx.tkn = tkn;
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
                    let x = {
                        iss: "https://accounts.google.com",
                        azp: "1025940019103-kjpk2fhm7dj22n3nf8bggloha436u2ok.apps.googleusercontent.com",
                        aud: "1025940019103-kjpk2fhm7dj22n3nf8bggloha436u2ok.apps.googleusercontent.com",
                        sub: "102766167047374079848",
                        email: "rakibul.islam.r609@gmail.com",
                        email_verified: "true",
                        at_hash: "Zj-Pxr7Hl0_fN54lrEEm7A",
                        name: "MD RAKIBUL ISLAM RAKIB",
                        picture: "https://lh3.googleusercontent.com/a/ACg8ocIvycEYKnSOJgnWsb7OEs5ThBpx_Kg6mIDqsC_r-1PuiHCobG8=s96-c",
                        given_name: "MD RAKIBUL ISLAM",
                        family_name: "RAKIB",
                        iat: "1763324252",
                        exp: "1763327852",
                        alg: "RS256",
                        kid: "4feb44f0f7a7e27c7c403379aff20af5c8cf52dc",
                        typ: "JWT",
                    }
                    console.log(user)
                    // let info: EncryptAuthType = {
                    //     email: user?.email,
                    //     login_type: 'google',
                    //     profile_info: {
                    //         email_verified: true,
                    //         fullname: user.name,
                    //         username: `${user.email?.split("@")?.[0]}${generateID()?.split('-')?.[0]}`,
                    //         avatar_url: user.picture
                    //     },
                    //     available: true,
                    //     next: {
                    //         type: "account-create",
                    //         component: 'choose-team'
                    //     },
                    // }

                    // let { success, encrypted } = await encrypt(JSON.stringify(info), process.env.NEXT_PUBLIC_ENCRYPTED_PASSWORD as string);
                    // ctx.auth_url = CLIENT_REDIRECT_URL.auth(encrypted as string);

                    return success;
                }
            },
        }
    }
}), async (ctx) => {
    return ctx.json(ctx.login)
});
export { google };

