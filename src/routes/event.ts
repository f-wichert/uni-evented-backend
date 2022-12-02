import assert from 'assert';
import { Router } from 'express';
import { z } from 'zod';

import Event from '../db/models/event';
import Media from '../db/models/media';
import User from '../db/models/user';
import { requireAuth } from '../passport';
import { asyncHandler } from '../utils';
import { validateBody } from '../utils/validate';

const router = Router();

/**
 * Auth required
 *
 * input
 *  {
 *      // if not specified, will use user.currentEventId
 *      eventId?: string
 *  }
 *
 * returns
 *  {
 *      id: string
 *      name: string
 *      lat: number
 *      lon: number
 *      startDateTime: string
 *      endDateTime: string | null
 *      media: [{
 *          id: string
 *          mediaType: 'video' | 'image'
 *          fileAvailable: boolean
 *      }]
 *      attendees: [{
 *          id: string
 *          username: string
 *          displayName: string | null
 *      }]
 *      currentAttendees: [{
 *          id: string
 *          username: string
 *          displayName: string | null
 *      }]
 *  }
 */
router.get(
    '/info',
    requireAuth,
    validateBody(z.object({ eventId: z.string().optional() })),
    asyncHandler(async (req, res) => {
        const user = req.user!;
        const { eventId } = req.body;
        const actualEventId = eventId || user.currentEventId;

        assert(actualEventId, 'no eventId specified and user is not attening an event');

        const event = await Event.findOne({
            where: { id: actualEventId },
            attributes: { exclude: ['createdAt', 'updatedAt'] },
            include: [
                { model: Media, as: 'media', attributes: { exclude: ['createdAt', 'updatedAt'] } },
                {
                    model: User,
                    as: 'attendees',
                    attributes: ['id', 'username', 'displayName'],
                },
                {
                    model: User,
                    as: 'currentAttendees',
                    attributes: ['id', 'username', 'displayName'],
                },
            ],
        });

        assert(event, `no event with id ${actualEventId} found`);

        res.json(event);
    })
);

export default router;
