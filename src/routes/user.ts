import { Router } from 'express';
import httpError from 'http-errors';
import { z } from 'zod';

import User from '../db/models/user';
import { pick } from '../utils';
import { validateBody, validateParams } from '../utils/validate';

const router = Router();

const userIDSchema = z.string().uuid().or(z.literal('@me'));

function formatUserForResponse(user: User) {
    return pick(user, ['id', 'username', 'displayName']);
}

router.get(
    '/:userID',
    // `userID` may be a user's ID, or '@me' in which case additional fields are included
    validateParams(z.object({ userID: userIDSchema })),
    async (req, res) => {
        const { userID } = req.params;

        const isMe = userID === '@me';

        let user: User | null;
        if (isMe) {
            user = req.user!;
        } else {
            user = await User.findByPk(userID);
        }

        if (!user) {
            throw new httpError.NotFound('User not found');
        }

        res.json({
            ...formatUserForResponse(user),
            // include more fields if request is current user
            ...(isMe ? { currentEventId: user.currentEventId } : {}),
        });
    },
);

router.patch(
    '/:userID',
    validateParams(z.object({ userID: userIDSchema })),
    validateBody(z.object({ username: z.string().optional(), displayName: z.string().nullish() })),
    async (req, res) => {
        const { userID } = req.params;

        const isMe = userID === '@me';
        if (!isMe) {
            // could implement editing of other users (assuming admin perms) here, if needed
            throw httpError.Forbidden();
        }

        const user = await req.user!.update({
            username: req.body.username,
            displayName: req.body.displayName,
        });

        res.json(formatUserForResponse(user));
    },
);

export default router;
