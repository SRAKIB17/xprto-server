import crypto from 'node:crypto';
import { encrypt } from './encrypted';
let length = 16;

export function wrappedCryptoToken({
    salt = crypto.randomBytes(Math.ceil(length / 2)).toString("hex").slice(0, length),
    wrappedCryptoString = ''
}: {
    salt?: any,
    wrappedCryptoString?: any
}) {
    try {
        // (B2) SHA512 HASH
        let hash = crypto.createHmac("sha256", salt);
        hash.update(wrappedCryptoString);
        return {
            salt: salt,
            success: true,
            hash: hash.digest("base64")
        }
    }
    catch (err: any) {
        return {
            success: false,
            salt: null,
            hash: null,
            message: err.message
        }
    }
};

export default async function tokenEncodedCrypto({
    account,
    name,
    email,
    data,
    hashed,
    role,
    phone,
    method,
    tokenSecret = process.env.CRYPTO_KEY
}: {
    account?: string,
    name?: string,
    data?: Record<string, any>
    method?: 'email' | 'google' | 'facebook',
    email?: string | any,
    hashed?: any,
    role?: any,
    phone?: string,
    tokenSecret?: string
}) {
    // (B1) GENERATE RANDOM SALT
    const { hash, salt } = wrappedCryptoToken({
        wrappedCryptoString: hashed
    });
    const ref_tkn = {
        name: name,
        account: account,
        phone: phone,
        email: email,
        data: data,
        session: `${salt}####${hash}`,
        role: role,
        method: method
    };
    const refreshTokenGen = (await encrypt(JSON.stringify(ref_tkn), tokenSecret as string)).encrypted;
    return refreshTokenGen;
}

