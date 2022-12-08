import bcrypt from 'bcrypt';
import base58 from 'bs58';
import crypto from 'crypto';
import { promisify } from 'util';

// A factor of 10 is quite low, but good enough for our purposes
// https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html#bcrypt
const BCRYPT_WORK_FACTOR = 10;

export async function hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(BCRYPT_WORK_FACTOR);
    return await bcrypt.hash(password, salt);
}

export async function verifyPassword(input: string, target: string): Promise<boolean> {
    return await bcrypt.compare(input, target);
}

export async function randomAscii(bytes: number): Promise<string> {
    const data = await promisify(crypto.randomBytes)(bytes);
    // base58 is like base64, but without special (+=) or ambiguous (oOIl) characters
    return base58.encode(data);
}
