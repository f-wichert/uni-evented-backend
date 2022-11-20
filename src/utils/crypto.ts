import bcrypt from 'bcrypt';

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
