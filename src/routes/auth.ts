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
        email: user.email,
        username: user.username,
        displayName: user.displayName,
    });
});

router.post(
    '/register',
    validateBody(
        z.object({ email: z.string().email(), username: z.string(), password: z.string() })
    ),
    asyncHandler(async (req, res) => {
        const { email, username, password } = req.body;

        // This is also enforced to be unique on the DB level, but we check
        // beforehand to avoid unnecessary operations and provide better error messages
        const existing = await User.getByEmailOrUsername(email, username);
        if (existing) {
            if (existing.username.toLowerCase() == username.toLowerCase())
                throw new Error('Username already taken!');
            throw new Error('User with given email already exists!');
        }

        const user = await User.create({ email, username, password });

        res.json({ token: createTokenForUser(user) });
    })
);

router.post(
    '/login',
    validateBody(z.object({ username: z.string(), password: z.string() })),
    asyncHandler(async (req, res) => {
        const { username, password } = req.body;

        // Try provided username for both email and username fields,
        // i.e. allow login using email as well
        const user = await User.getByEmailOrUsername(username, username);
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
