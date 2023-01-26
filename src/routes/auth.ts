import { Router } from 'express';
import httpError from 'http-errors';
import { z } from 'zod';

import PushToken from '../db/models/pushToken';
import User from '../db/models/user';
import { createTokenForUser, requireAuth } from '../passport';
import { randomAscii } from '../utils/crypto';
import { sendMail } from '../utils/email';
import { validateBody } from '../utils/validate';

const router = Router();

router.post(
    '/register',
    validateBody(
        z.object({ email: z.string().email(), username: z.string(), password: z.string() }),
    ),
    async (req, res) => {
        const { email, username, password } = req.body;

        // This is also enforced to be unique on the DB level, but we check
        // beforehand to avoid unnecessary operations and provide better error messages
        const existing = await User.getByEmailOrUsername(email, username);
        if (existing) {
            if (existing.username.toLowerCase() === username.toLowerCase())
                throw httpError.Conflict('Username already taken');
            throw httpError.Conflict('Username with given email already exists');
        }

        const user = await User.create({ email, username, password });

        res.json({ token: createTokenForUser(user) });
    },
);

router.post(
    '/login',
    validateBody(z.object({ username: z.string(), password: z.string() })),
    async (req, res) => {
        const { username, password } = req.body;

        // Try provided username for both email and username fields,
        // i.e. allow login using email as well
        const user = await User.getByEmailOrUsername(username, username);
        if (!user) {
            throw httpError.NotFound(`No user named '${username}'`);
        }

        // Verify provided password (may also be reset token)
        if (!(await user.verifyPassword(password))) {
            throw httpError.Unauthorized('Incorrect password');
        }

        // if authorized and the user has a reset token, remove it
        if (user.passwordResetToken) {
            await user.update({ passwordResetToken: null });
        }

        res.json({ token: createTokenForUser(user) });
    },
);

router.post('/reset', validateBody(z.object({ email: z.string().email() })), async (req, res) => {
    const { email } = req.body;

    const user = await User.findOne({ where: { email: email } });
    if (!user) {
        throw httpError.NotFound(`User not found`);
    }

    // generate random reset token, store in database
    const resetToken = await randomAscii(16);
    await user.update({ passwordResetToken: resetToken });

    // send reset token to user through email
    await sendMail(user.email, 'Password reset', {
        text:
            `A password reset was requested on your account. ` +
            `Please use the following one-time token as the password to log in, ` +
            `and then change your password in the profile settings:\n\n` +
            `\t${resetToken}` +
            `\n\nIf you did not request this action, feel free to ignore this message.`,
    });

    res.send({});
});

router.post(
    '/registerPush',
    requireAuth,
    validateBody(z.object({ token: z.string() })),
    async (req, res) => {
        // create if token doesn't exist yet, otherwise update userId of existing row
        await PushToken.upsert({ token: req.body.token, userId: req.user!.id });
        res.send({});
    },
);

// n.b. this does not require auth by design
router.post('/unregisterPush', validateBody(z.object({ token: z.string() })), async (req, res) => {
    await PushToken.destroy({ where: { token: req.body.token } });
    res.send({});
});

export default router;
