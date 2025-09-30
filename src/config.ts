
export const BASE_URL = 'http://localhost:8080';
export const AI_URL = "http://localhost:8081";
export const CDN_URL = "http://localhost:8082";
export const cookieDOMAIN = "localhost";

export const support_email = "support@papernxt.com";
export const API_VERSION = 'v1';
export const API_BASE_URL = `${BASE_URL}/${API_VERSION}`;
export const API_BASE_URL_V1 = `${BASE_URL}/v1`;

export const FORGET_PASSWORD_EXP = 20 * 60 * 1000;  // 5 minutes from now

import os from 'node:os';
import path from 'node:path';

export const tempDir = () => os.tmpdir(); // usually '/tmp'
export const DirectoryServe = {
    myServices: {
        images: (pathname: string) => path.join(path.resolve(), `/uploads/trainer-services/images/${filename(pathname)}`),
        video: (pathname: string) => path.join(path.resolve(), `/uploads/trainer-services/video/${filename(pathname)}`),
        attachments: (pathname: string) => path.join(path.resolve(), `/uploads/trainer-services/attachments/${filename(pathname)}`)
    },
    supportTicket: (filename: string) => path.join(path.resolve(), "uploads", "attachments", "support-tickets", filename),
}

export const filename = (full_path: string) => path.basename(full_path);
// let storage_path = ;
//  const storage_path = path.join( path.resolve(),    "uploads", "attachments",   "support-tickets",      fileName);