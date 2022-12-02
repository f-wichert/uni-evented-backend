import assert from 'assert';
import { Router } from 'express';
import { z } from 'zod';

import Event from '../db/models/event';
import Media from '../db/models/media';
import User from '../db/models/user';
import { requireAuth } from '../passport';
import { asyncHandler } from '../utils';
import { haversine } from '../utils/math';
import { validateBody } from '../utils/validate';

const router = Router();

/**
 * Get information about a specified event
 *
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
 *      startDateTime: Date
 *      endDateTime: Date | null
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
    validateBody(
        z.object({
            // if not specified will use user.currentEventId
            eventId: z.string().optional(),
        })
    ),
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

/**
 * Create a new event
 *
 * Auth required
 *
 * input
 *  {
        name: string
        lat: number
        lon: number
        // now if not specified
        startDateTime?: Date
        // open ended if not specified
        endDateTime?: Date
 *  }
 *
 * returns
 *  {
 *      eventId: string
 *  }
 */
router.post(
    '/create',
    requireAuth,
    validateBody(
        z.object({
            name: z.string(),
            lat: z.number(),
            lon: z.number(),
            startDateTime: z.date().optional(),
            endDateTime: z.date().optional(),
        })
    ),
    asyncHandler(async (req, res) => {
        const user = req.user!;
        const { name, lat, lon, startDateTime, endDateTime } = req.body;
        const actualStartDateTime = startDateTime || new Date();

        // TODO: more validation
        assert(!user.currentEventId, 'user is already attending an event');
        assert(!endDateTime || actualStartDateTime < endDateTime, 'start time is after end time');

        // TODO: how do we handle multiple scheduled / overlapping events?

        const event = await Event.create({
            name: name,
            lat: lat,
            lon: lon,
            startDateTime: actualStartDateTime,
            endDateTime: endDateTime,
            hostId: user.id,
        });

        res.json({
            eventId: event.id,
        });
    })
);

/**
 * Join an event if it is close enough
 *
 * Auth required
 *
 * input
 *  {
 *      eventId: string
 *      lat: number
 *      lon: number
 *  }
 */
router.post(
    '/join',
    requireAuth,
    validateBody(
        z.object({
            eventId: z.string(),
            lat: z.number(),
            lon: z.number(),
        })
    ),
    asyncHandler(async (req, res) => {
        const user = req.user!;
        const { eventId, lat, lon } = req.body;

        assert(!user.currentEventId, 'user is already attending an event');

        const event = await Event.findOne({ where: { id: eventId } });

        assert(event);

        // TODO: make configurable?
        const maxEventDistance = 10.0;
        assert(haversine(lat, lon, event.lat, event.lon) <= maxEventDistance);

        // TODO: implement more join conditions (maxAttendees, etc.)

        await event.addAttendee(user);
        user.currentEventId = event.id;
        await user.save();

        res.json({});
    })
);

/**
 * Leave the currently attended
 *
 * Auth required
 */
router.post(
    '/leave',
    requireAuth,
    asyncHandler(async (req, res) => {
        const user = req.user!;

        assert(user.currentEventId, 'user is not attending an event');

        user.currentEventId = null;
        await user.save();

        res.json({});
    })
);

export default router;
