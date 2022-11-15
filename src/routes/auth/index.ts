import { Request, Response, Router } from 'express';

import { User } from '../../db/models/user';
import { asyncHandler } from '../../utils';
import { requireAuth, signToken } from '../passportUtils';

const router = Router();

router.post(
    '/login',
    asyncHandler(async (req: Request, res: Response) => {
        // TODO: validate request payload
        const { username, password } = req.body as Record<string, string>;

        // partially taken from https://www.passportjs.org/concepts/authentication/password/
        const user = await User.findOne({ where: { userName: username.toLowerCase() } });
        if (!user) {
            throw new Error(`No user named ${username}!`);
        }

        if (!user.verifyPassword(password)) {
            throw new Error('Incorrect password!');
        }

        const token = signToken({ userId: user.id });
        res.json({ token });
    })
);

router.get('/check', requireAuth, (req: Request, res: Response) => {
    res.json({ result: 'valid' });
});

export default router;
