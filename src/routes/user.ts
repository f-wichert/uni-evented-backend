import { Router } from 'express';
import httpError from 'http-errors';
import { z } from 'zod';

import User from '../db/models/user';
import { pick } from '../utils';
import { base64Schema, validateBody, validateParams } from '../utils/validate';

const router = Router();

const userIDSchema = z.string().uuid().or(z.literal('@me'));

function formatUserForResponse(user: User) {
    return pick(user, ['id', 'username', 'displayName', 'avatarHash']);
}

router.get(
    '/:userID',
    // `userID` may be a user's ID, or '@me' in which case additional fields are included
    validateParams(z.object({ userID: userIDSchema })),
    async (req, res) => {
        const { userID } = req.params;

        const isMe = userID === '@me';
        const user = isMe ? req.user! : await User.findByPk(userID);

        if (!user) {
            throw new httpError.NotFound('User not found');
        }

        res.json({
            ...formatUserForResponse(user),
            // include more fields if request is current user
            ...(isMe ? { currentEventId: await user.getCurrentEventId() } : {}),
        });
    },
);

router.patch(
    '/:userID',
    validateParams(z.object({ userID: userIDSchema })),
    validateBody(
        z.object({
            username: z.string().optional(),
            displayName: z.string().optional(),
            avatar: base64Schema.optional(),
        }),
    ),
    async (req, res) => {
        const { userID } = req.params;

        const isMe = userID === '@me';
        if (!isMe) {
            // could implement editing of other users (assuming admin perms) here, if needed
            throw httpError.Forbidden();
        }

        let user = req.user!;

        let avatarHash: string | undefined = undefined;
        if (req.body.avatar) {
            avatarHash = await user.handleAvatarUpdate(req.body.avatar);
        }

        user = await req.user!.update({
            username: req.body.username,
            displayName: req.body.displayName,
            avatarHash: avatarHash,
        });

        res.json(formatUserForResponse(user));
    },
);

export default router;
