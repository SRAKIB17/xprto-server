
export const BASE_URL = 'http://localhost:8080';

export const CDN_URL = "http://localhost:8082";
export const cookieDOMAIN = "localhost";

export const support_email = "support@papernxt.com";
export const API_VERSION = 'v1';
export const API_BASE_URL = `${BASE_URL}/${API_VERSION}`;
export const API_BASE_URL_V1 = `${BASE_URL}/v1`;

export const FORGET_PASSWORD_EXP = 20 * 60 * 1000;  // 5 minutes from now

export const CLIENT_URL = 'http://localhost:3000';
export const SITE_TITLE = "Xprto";

export const CLIENT_REDIRECT_URL = {
    account: `${CLIENT_URL}/account`,
    auth: (tkn: string) => `${CLIENT_URL}/auth?tkn=${tkn}`,
    error: (error: string) => `${CLIENT_URL}/error?error=${error}`,
    reset_password: (tkn: string) => `${CLIENT_URL}/auth/reset-password?tkn=${tkn}`,
    verify_email: (tkn: string) => `${CLIENT_URL}/auth/reset-password?tkn=${tkn}`,
    logout: (next?: string) => '/v1/auth/logout' + next ? `?next=${next}` : ""
}


import os from 'node:os';
import path from 'node:path';

export const tempDir = () => os.tmpdir(); // usually '/tmp'
export const DirectoryServe = {
    myServices: {
        images: (pathname: string) => path.join(path.resolve(), `/uploads/trainer-services/images/${filename(pathname)}`),
        video: (pathname: string) => path.join(path.resolve(), `/uploads/trainer-services/video/${filename(pathname)}`),
        attachments: (pathname: string) => path.join(path.resolve(), `/uploads/trainer-services/attachments/${filename(pathname)}`)
    },
    abuseReport: {
        evidence_url: (pathname: string) => path.join(path.resolve(), `/uploads/abuse-report/${filename(pathname)}`)
    },
    PLANS: {
        workout_plan: {
            EXERCISE: (pathname: string) => path.join(path.resolve(), `/uploads/plan/workouts/exercises/${filename(pathname)}`),
            Plans: (pathname: string) => path.join(path.resolve(), `/uploads/plan/workouts/plans/${filename(pathname)}`)
        },
        nutrition_plan: {
            MEAL: (pathname: string) => path.join(path.resolve(), `/uploads/plan/nutrition/meal/${filename(pathname)}`),
            Plans: (pathname: string) => path.join(path.resolve(), `/uploads/plan/nutrition/plans/${filename(pathname)}`)
        }
    },
    feedback: {
        trainer: (pathname: string) => path.join(path.resolve(), `/uploads/feedback/trainer/video/${filename(pathname)}`)
    },
    chat_messages: (pathname: string) => path.join(path.resolve(), "uploads", "attachments", "chats", filename(pathname)),
    thumbnail: {
        chat: (pathname: string) => path.join(path.resolve(), "uploads", "thumbnail", "chats", filename(pathname))
    },
    supportTicket: (pathname: string) => path.join(path.resolve(), "uploads", "attachments", "support-tickets", filename(pathname)),
    jobAttachments: (pathname: string) => path.join(path.resolve(), "uploads", "attachments", "job-applications", filename(pathname)),
    LeaveRequestAttachments: (pathname: string) => path.join(path.resolve(), "uploads", "attachments", "leave-request", filename(pathname)),
    avatar: (role: string, pathname: string) => path.join(path.resolve(), "uploads", "avatars", role, "kyc", filename(pathname)),
    logo: (role: string, pathname: string) => path.join(path.resolve(), "uploads", "logo", role, "kyc", filename(pathname)),
    verifications: {
        KYC: (pathname: string) => path.join(path.resolve(), "uploads", "verifications", "kyc", filename(pathname)),
        BADGE: (pathname: string) => path.join(path.resolve(), "uploads", "verifications", "badge", filename(pathname)),
        ASSURED: (pathname: string) => path.join(path.resolve(), "uploads", "verifications", "assured", filename(pathname)),
        SELFIE: (pathname: string) => path.join(path.resolve(), "uploads", "verifications", "selfie", filename(pathname)),
    }
}

export const filename = (full_path: string) => path.basename(full_path);
// let storage_path = ;
//  const storage_path = path.join( path.resolve(),    "uploads", "attachments",   "support-tickets",      fileName);