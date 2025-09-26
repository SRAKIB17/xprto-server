import crypto from "node:crypto";

const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;
const ALGO = 'aes-256-gcm';

function deriveKey(password: string, salt: any) {
    return crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, 'sha256');
}

export function encrypt(plainText: string, password: string) {
    try {
        const salt = crypto.randomBytes(SALT_LENGTH);
        const iv = crypto.randomBytes(IV_LENGTH);
        const key = deriveKey(password, salt);

        const cipher = crypto.createCipheriv(ALGO, key, iv);
        const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
        const authTag = cipher.getAuthTag();

        // Combine salt + iv + authTag + encrypted data
        const payload = Buffer.concat([salt, iv, authTag, encrypted]);

        return {
            success: true,
            encrypted: payload.toString('base64')
        }
    }
    catch {
        return {
            success: false,
            encrypted: null,
        }
    }
}

export function decrypt(base64Text: string, password: string) {
    try {
        const buffer = Buffer.from(base64Text, 'base64');
        const salt = buffer.subarray(0, SALT_LENGTH);
        const iv = buffer.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
        const authTag = buffer.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + 16);
        const encrypted = buffer.subarray(SALT_LENGTH + IV_LENGTH + 16);

        const key = deriveKey(password, salt);
        const decipher = crypto.createDecipheriv(ALGO, key, iv);
        decipher.setAuthTag(authTag);

        const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
        return { success: true, decrypted: decrypted.toString('utf8') };
    }
    catch {
        return { success: false, decrypted: null }
    }
}

// // Example usage
// const password = 'myStrongPassword123!';
// const message = 'test@email.com';

// const encrypted = encrypt(message, password);
// console.log('Encrypted:', encrypted);

// const decrypted = decrypt(encrypted, password);
// console.log('Decrypted:', decrypted);
