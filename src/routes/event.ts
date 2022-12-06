import assert from 'assert';
import { Router } from 'express';
import { Op } from 'sequelize';
import { z } from 'zod';

import Event from '../db/models/event';
import Media from '../db/models/media';
import User from '../db/models/user';
import { requireAuth } from '../passport';
import { asyncHandler } from '../utils';
import { haversine } from '../utils/math';
import { dateSchema, validateBody } from '../utils/validate';

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
        tags?: string[]
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
            // TODO: make mandatory
            tags: z.array(z.string()).optional(),
            lat: z.number(),
            lon: z.number(),
            startDateTime: dateSchema.nullish(),
            endDateTime: dateSchema.nullish(),
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

router.post(
    '/close',
    requireAuth,
    validateBody(
        z.object({
            /** if not specified try to get currently attended event */
            eventId: z.string().optional(),
        })
    ),
    asyncHandler(async (req, res) => {
        const user = req.user!;
        const { eventId } = req.body;

        const actualEventId = eventId || user.currentEventId;

        assert(actualEventId, 'no eventId found');

        const event = await Event.findOne({
            where: { id: actualEventId },
            include: [
                {
                    model: User,
                    as: 'attendees',
                },
            ],
        });

        assert(event, `no event with id: ${actualEventId}`);
        assert(
            event.hostId == user.id,
            `${user.id} tried to close event ${actualEventId}, but host is ${event.hostId}`
        );
        assert(event.status != 'completed', 'event aready completed');

        // remove all current attendees from the event
        const userSavePromises = event.attendees!.map((user) => {
            user.currentEventId = null;
            return user.save();
        });
        await Promise.all(userSavePromises);

        event.status = 'completed';
        await event.save();

        res.json({});
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
 * Leave the currently attended event
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

/**
 * Find events, based on which input options are specified
 *
 * input
 *  {
 *      statuses?: ['scheduled' | 'active' | 'completed']
 *      loadUsers?: boolean
 *      loadMedia?: boolean
 *      lat?: number
 *      lon?: number
 *      maxResults?: number
 *      maxRadius?: number
 *  }
 *
 * If lat and lon are specified the output will be sorted by distance
 * maxResults and maxRadius are only available if location is specified
 *
 * returns
 *  { events: [
 *      id: string
 *      name: string
 *      lat: number
 *      lon: number
 *      startDateTime: Date
 *      endDateTime: Date | null
 *
 *      // if loadMedia is true
 *      media: [{
 *          id: string
 *          mediaType: 'video' | 'image'
 *          fileAvailable: boolean
 *      }]
 *
 *      // if loadUsers is true
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
 *  ]}
 */
router.get(
    '/find',
    requireAuth,
    validateBody(
        z.object({
            statuses: z.array(z.string()).optional(),
            loadUsers: z.boolean().optional(),
            loadMedia: z.boolean().optional(),
            lat: z.number().optional(),
            lon: z.number().optional(),
            maxResults: z.number().optional(),
            maxRadius: z.number().optional(),
        })
    ),
    asyncHandler(async (req, res) => {
        const { statuses, loadMedia, loadUsers, lat, lon, maxResults, maxRadius } = req.body;

        const includes = [];
        if (loadMedia) {
            includes.push({
                model: Media,
                as: 'media',
                attributes: { exclude: ['createdAt', 'updatedAt'] },
            });
        }
        if (loadUsers) {
            includes.push(
                {
                    model: User,
                    as: 'attendees',
                    attributes: ['id', 'username', 'displayName'],
                },
                {
                    model: User,
                    as: 'currentAttendees',
                    attributes: ['id', 'username', 'displayName'],
                }
            );
        }

        let events = await Event.findAll({
            where: {
                status: {
                    [Op.or]: statuses ? statuses : [],
                },
            },
            attributes: { exclude: ['createdAt', 'updatedAt'] },
            include: includes,
        });

        // location specified
        if (lat && lon) {
            // filter out events that are too far away
            if (maxRadius) {
                events = events.filter(
                    (event) => haversine(lat, lon, event.lat, event.lon) <= maxRadius
                );
            }

            // TODO: always sort?
            events.sort((event1, event2) => {
                const dist1 = haversine(lat, lon, event1.lat, event1.lon);
                const dist2 = haversine(lat, lon, event2.lat, event2.lon);
                return dist1 - dist2;
            });

            if (maxResults && maxResults < events.length) {
                events = events.splice(0, maxResults);
            }
        }

        res.json({ events: events });
    })
);

export default router;
