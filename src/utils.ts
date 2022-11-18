import bcrypt from 'bcrypt';
import { NextFunction, Request, Response } from 'express';

/** Properly handles async errors in express routers */
export function asyncHandler(fn: (req: Request, res: Response) => Promise<void>) {
    return function (req: Request, res: Response, next: NextFunction): void {
        fn(req, res).catch(next);
    };
}

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
