import assert from 'assert';
import { Router } from 'express';
import { Op } from 'sequelize';
import { z } from 'zod';
import Event from '../db/models/event';
import Media from '../db/models/media';
import User from '../db/models/user';
import { validateBody, validateParams } from '../utils/validate';

const router = Router();

/**
 * Get all users
 *
 * output
 * [{
 *      id: uuid
 *      username: string
 *      displayName: string
 *      avatarHash: string | null
 * }]
 */
router.get('/user/all', async (req, res) => {
    const users = await User.findAll({
        attributes: ['id', 'username', 'displayName', 'avatarHash'],
    });
    res.json(users);
});

/**
 * Clear a users avatar, also deletes the image
 *
 * input
 * {
 *      userId: uuid
 * }
 */
router.post(
    '/user/clear-avatar',
    validateBody(z.object({ userId: z.string().uuid() })),
    async (req, res) => {
        const { userId } = req.body;
        const user = await User.findByPk(userId);
        assert(user);
        await user.handleAvatarUpdate(null);
        res.json({});
    },
);

/**
 * Delete a user and everything that references them
 *
 * input
 * {
 *      userId: uuid
 * }
 */
router.post(
    '/user/delete',
    validateBody(z.object({ userId: z.string().uuid() })),
    async (req, res) => {
        const { userId } = req.body;
        const user = await User.findByPk(userId);
        assert(user);
        await user.destroy();
        res.json({});
    },
);

/**
 * Get all events with the specified statuses
 *
 * input
 * {
 *      statuses?: string[]
 * }
 *
 * output
 * [{
 *      id: uuid
 *      name: string
 *      hostId: uuid
 *      lat: number
 *      lon: number
 *      startDateTime: Date
 *      endDateTime: Date | null
 *      description: string
 * }]
 */
router.get(
    '/event/all/:statuses',
    validateParams(z.object({ statuses: z.array(z.string()).optional() })),
    async (req, res) => {
        const { statuses } = req.params;
        const events = await Event.findAll({
            where: { status: { [Op.or]: statuses ?? ['active'] } },
            attributes: { exclude: ['createdAt', 'updatedAt'] },
        });
        res.json(events);
    },
);

/**
 * Get all media associated with an event
 *
 * input
 * {
 *      eventId: uuid
 * }
 */
router.get(
    '/event/media/:eventId',
    validateParams(z.object({ eventId: z.string().uuid() })),
    async (req, res) => {
        const { eventId } = req.params;
        const media = await Media.findAll({
            where: { eventId, fileAvailable: true },
        });
        res.json(media);
    },
);

/**
 * Force an event to stop
 *
 * input
 * {
 *      eventId: uuid
 * }
 */
router.post(
    '/event/stop',
    validateBody(z.object({ eventId: z.string().uuid() })),
    async (req, res) => {
        const { eventId } = req.body;
        const event = await Event.findByPk(eventId);
        assert(event);
        await event.stop();
        res.json({});
    },
);

/**
 * Delete an event and all media associated with it
 *
 * input
 * {
 *      eventId: uuid
 * }
 */
router.post(
    '/event/delete',
    validateBody(z.object({ eventId: z.string().uuid() })),
    async (req, res) => {
        const { eventId } = req.body;
        const event = await Event.findByPk(eventId);
        assert(event);
        await event.destroy();
        res.json({});
    },
);

/**
 * Delete media
 *
 * input
 * {
 *      mediaId: uuid
 * }
 */
router.post(
    '/media/delete',
    validateBody(z.object({ mediaId: z.string().uuid() })),
    async (req, res) => {
        const { mediaId } = req.body;
        const media = await Media.findByPk(mediaId);
        assert(media);
        await media.destroy();
        res.json({});
    },
);

export default router;
