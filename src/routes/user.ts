import { Router } from 'express';
import httpError from 'http-errors';
import { z } from 'zod';
import Tag from '../db/models/tag';

import User from '../db/models/user';
import { base64Schema, validateBody, validateParams } from '../utils/validate';

const router = Router();

const userIDSchema = z.string().uuid().or(z.literal('@me'));

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
            // include more fields if request is current user
            ...user.formatForResponse({ isMe }),
            ...(isMe
                ? {
                      currentEventId: await user.getCurrentEventId(),
                      favouriteTags: await user.getFavouriteTags(),
                      recommendationSettings: user.getRecommendationSettings(),
                  }
                : {}),
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

        res.json(user.formatForResponse({ isMe }));
    },
);

router.post(
    '/setFavouriteTags',
    validateBody(z.object({ favouriteTags: z.array(z.string()) })),
    async (req, res) => {
        const user = req.user!;
        const favouriteTagsList: Tag[] = (
            await Promise.all(
                req.body.favouriteTags.map(async (tagId: string) => {
                    return Tag.findByPk(tagId).catch((err) => null);
                }),
            )
        ).filter((tag): tag is Tag => Boolean(tag));
        await user.setFavouriteTags(favouriteTagsList);
        res.json({});
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
