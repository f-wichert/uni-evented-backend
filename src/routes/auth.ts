import { Router } from 'express';
import { z } from 'zod';

import User from '../db/models/user';
import { createTokenForUser, requireAuth } from '../passport';
import { asyncHandler } from '../utils';
import { validateBody } from '../utils/validate';

const router = Router();

router.get('/info', requireAuth, (req, res) => {
    const user = req.user!;
    res.json({
        id: user.id,
        username: user.username,
        displayName: user.displayName,
    });
});

router.post(
    '/register',
    validateBody(z.object({ username: z.string(), password: z.string() })),
    asyncHandler(async (req, res) => {
        const { username, password } = req.body;

        // This is also enforced to be unique on the DB level, but we check
        // beforehand to avoid unnecessary operations
        if (await User.getByUserName(username)) {
            throw new Error('User already exists!');
        }

        const user = await User.create({ username: username, password: password });

        res.json({ token: createTokenForUser(user) });
    })
);

router.post(
    '/login',
    validateBody(z.object({ username: z.string(), password: z.string() })),
    asyncHandler(async (req, res) => {
        const { username, password } = req.body;

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
