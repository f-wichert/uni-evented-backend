import { Router } from 'express';
import httpError from 'http-errors';
import { z } from 'zod';

import User from '../db/models/user';
import {
    base64Schema,
    booleanSchema,
    validateBody,
    validateParams,
    validateQuery,
} from '../utils/validate';

const router = Router();

const userIDSchema = z.string().uuid().or(z.literal('@me'));

router.get(
    '/:userID',
    // `userID` may be a user's ID, or '@me' in which case additional fields are included
    validateParams(z.object({ userID: userIDSchema })),
    validateQuery(z.object({ details: booleanSchema.optional() })),
    async (req, res) => {
        const { userID } = req.params;
        const { details: includeDetails } = req.query;

        const isMe = userID === '@me';
        const user = isMe ? req.user! : await User.findByPk(userID);

        if (!user) {
            throw new httpError.NotFound('User not found');
        }

        const details = includeDetails ? await user.getProfileDetails(req.user!) : undefined;

        res.json({
            // include more fields if request is current user
            ...user.formatForResponse({ isMe }),
            ...(isMe
                ? {
                      currentEventId: await user.getCurrentEventId(),
                      favouriteTags: (await user.getFavouriteTags()).map((t) => t.id),
                      recommendationSettings: user.getRecommendationSettings(),
                  }
                : {}),
            details,
        });
    },
);

router.patch(
    '/:userID',
    validateParams(z.object({ userID: userIDSchema })),
    validateBody(
        z.object({
            avatar: base64Schema.nullish(),
            username: z.string().optional(),
            displayName: z.string().optional(),
            bio: z.string().optional(),
            favouriteTags: z.array(z.string()).optional(),

            email: z.string().optional(),
            password: z.string().optional(),
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

        let avatarHash: string | null | undefined = undefined;
        if (req.body.avatar !== undefined) {
            avatarHash = await user.handleAvatarUpdate(req.body.avatar);
        }

        user = await req.user!.update({
            avatarHash: avatarHash,
            username: req.body.username,
            displayName: req.body.displayName,
            bio: req.body.bio,

            email: req.body.email,
            password: req.body.password,
        });

        if (req.body.favouriteTags) {
            await user.setFavouriteTags(req.body.favouriteTags);
        }

        res.json(user.formatForResponse({ isMe }));
    },
);

router.get(
    '/:userID/:type(following|followers)',
    validateParams(z.object({ userID: userIDSchema, type: z.enum(['following', 'followers']) })),
    async (req, res) => {
        const { userID, type } = req.params;

        const user = userID === '@me' ? req.user! : await User.findByPk(userID);
        if (!user) {
            throw new httpError.NotFound('User not found');
        }

        const users = type === 'following' ? await user.getFollowees() : await user.getFollowers();
        res.json(users.map((u) => u.formatForResponse()));
    },
);

router.post(
    '/setRecommendationSettings',
    validateBody(
        z.object({
            DistanceWeight: z.number(),
            TagIntersectionWeight: z.number(),
            FolloweeIntersectionWeight: z.number(),
            AverageEventRatingWeight: z.number(),
            NumberOfMediasWeigth: z.number(),
        }),
    ),
    async (req, res) => {
        const user = req.user!;
        user.DistanceWeight = req.body.DistanceWeight;
        user.TagIntersectionWeight = req.body.TagIntersectionWeight;
        user.FolloweeIntersectionWeight = req.body.FolloweeIntersectionWeight;
        user.AverageEventRatingWeight = req.body.AverageEventRatingWeight;
        user.NumberOfMediasWeight = req.body.NumberOfMediasWeigth;
        await user.save();
        res.json({});
    },
);

export default router;
