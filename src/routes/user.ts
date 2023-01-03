import { Router } from 'express';
import httpError from 'http-errors';
import { z } from 'zod';

import User from '../db/models/user';
import { validateParams } from '../utils/validate';

const router = Router();

/**
 * `userID` may be a user's ID, or '@me' in which case additional fields are included.
 */
router.get(
    '/:userID',
    validateParams(z.object({ userID: z.string().uuid().or(z.literal('@me')) })),
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
            id: user.id,
            username: user.username,
            displayName: user.displayName,
            // include more fields if request is current user
            ...(isMe ? { currentEventId: user.currentEventId } : {}),
        });
    },
);

export default router;
