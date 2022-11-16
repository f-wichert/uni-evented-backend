import { Request, Response, Router } from 'express';

import { User } from '../../db/models/user';
import { asyncHandler } from '../../utils';
import { createTokenForUser, requireAuth } from '../passportUtils';

const router = Router();

router.get('/check', requireAuth, (req: Request, res: Response) => {
    res.json({ result: 'valid', id: req.user!.id });
});

router.post(
    '/register',
    asyncHandler(async (req: Request, res: Response) => {
        // TODO: validate request payload
        const { username, password } = req.body as Record<string, string>;

        // This is also enforced to be unique on the DB level, but we check
        // beforehand to avoid unnecessary operations
        if (await User.getByUserName(username)) {
            throw new Error('User already exists!');
        }

        const user = await User.create({ userName: username, password: password });

        res.json({ token: createTokenForUser(user) });
    })
);

router.post(
    '/login',
    asyncHandler(async (req: Request, res: Response) => {
        // TODO: validate request payload
        const { username, password } = req.body as Record<string, string>;

        // inspired by https://www.passportjs.org/concepts/authentication/password/
        const user = await User.getByUserName(username);
        if (!user) {
            throw new Error(`No user named ${username}!`);
        }

        if (!(await user.verifyPassword(password))) {
            throw new Error('Incorrect password!');
        }

        res.json({ token: createTokenForUser(user) });
    })
);

export default router;
