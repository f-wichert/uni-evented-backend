import assert from 'assert';
import { Router } from 'express';
import { Op } from 'sequelize';
import { z } from 'zod';

import Event, { EventStatus } from '../db/models/event';
import EventAttendee from '../db/models/eventAttendee';
import EventTags from '../db/models/eventTags';
import Media from '../db/models/media';
import Message from '../db/models/message';
import Tag from '../db/models/tag';
import User from '../db/models/user';
import { haversine } from '../utils/math';
import { dateSchema, validateBody, validateParams } from '../utils/validate';

async function getEventForResponse(id: string) {
    return await Event.findOne({
        where: { id },
        attributes: { exclude: ['createdAt', 'updatedAt'] },
        include: [
            {
                model: Media,
                as: 'media',
                attributes: ['id', 'type', 'fileAvailable', 'userId', 'eventId'],
                where: { fileAvailable: true },
                required: false,
            },
            {
                model: User,
                as: 'attendees',
                attributes: ['id', 'username', 'displayName', 'avatarHash'],
                through: { as: 'eventAttendee', attributes: ['status'] },
            },
            {
                model: Tag,
                as: 'tags',
                attributes: ['label', 'color', 'value', 'parent'],
            },
        ],
    });
}

const router = Router();

/**
 * Get information about a specified event
 *
 * input
 *  {
 *      eventId: string
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
 *          displayName: string
 *          avatarHash: string | null
 *      }]
 *      currentAttendees: [{
 *          id: string
 *          username: string
 *          displayName: string
 *          avatarHash: string | null
 *      }]
 *      tags: [{
 *          label: string
 *          color: string
 *          value: string
 *          parent: string
 *          EventTags: {
 *              tagID: TAG UUID PK
 *              eventId: Event UUID PK
 *          }
 *      }]
 *  }
 */
router.get(
    '/info/:eventId',
    validateParams(
        z.object({
            eventId: z.string().uuid(),
        }),
    ),
    async (req, res) => {
        const { eventId } = req.params;
        const event = await getEventForResponse(eventId);
        assert(event, `no event with id ${eventId} found`);
        res.json(event);
    },
);

router.get(
    '/info/:eventId/media',
    validateParams(
        z.object({
            eventId: z.string().uuid(),
        }),
    ),
    async (req, res) => {
        const { eventId } = req.params;
        const event = await Event.findByPk(eventId);
        assert(event, `no event with id ${eventId} found`);

        const media = await event.getMedia({
            attributes: ['id', 'type', 'fileAvailable', 'userId', 'eventId'],
            where: {
                fileAvailable: true,
            },
        });
        res.json(media);
    },
);

/**
 * Create a new event
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
    validateBody(
        z.object({
            name: z.string(),
            description: z.string().optional(),
            // TODO: make mandatory
            tags: z.array(z.string()).optional(),
            lat: z.number(),
            lon: z.number(),
            startDateTime: dateSchema.nullish(),
            endDateTime: dateSchema.nullish(),
        }),
    ),
    async (req, res) => {
        const user = req.user!;
        const { name, lat, lon, startDateTime, endDateTime, tags, description } = req.body;
        const actualStartDateTime = startDateTime ?? new Date();

        // TODO: more validation
        assert(!endDateTime || actualStartDateTime < endDateTime, 'start time is after end time');

        let event = await Event.create({
            name: name,
            lat: lat,
            lon: lon,
            startDateTime: actualStartDateTime,
            endDateTime: endDateTime,
            hostId: user.id,
            description: description,
        });

        const eventTags = tags?.map((el) => ({
            tagId: el,
            eventId: event.id,
        })) as unknown as EventTags[];
        await EventTags.bulkCreate(eventTags);

        // fetch full event from db for consistency
        event = (await getEventForResponse(event.id))!;

        res.json(event);
    },
);

router.post(
    '/close',
    validateBody(
        z.object({
            eventId: z.string(),
        }),
    ),
    async (req, res) => {
        const user = req.user!;
        const { eventId } = req.body;

        const event = await Event.findByPk(eventId);

        assert(event, `no event with id: ${eventId}`);
        assert(
            event.hostId === user.id,
            `${user.id} tried to close event ${eventId}, but host is ${event.hostId}`,
        );
        assert(event.status !== 'completed', 'event aready completed');

        // remove all current attendees from the event
        await EventAttendee.update(
            { status: 'left' },
            { where: { eventId: eventId, status: 'attending' } },
        );

        await event.update({ status: 'completed' });

        res.json({});
    },
);

/**
 * Join an event or just show interest in the event
 *
 * input
 *  {
 *      eventId: string
 *      interested?: boolean
 *  }
 */
router.post(
    '/join',
    validateBody(
        z.object({
            eventId: z.string(),
            interested: z.boolean().optional(),
        }),
    ),
    async (req, res) => {
        const user = req.user!;
        const { eventId, interested } = req.body;

        assert(interested || !(await user.getCurrentEventId()));

        const event = await Event.findByPk(eventId);

        assert(event);

        // TODO: implement more join conditions (maxAttendees, etc.)

        await (interested ? user.followEvent(event) : user.setCurrentEvent(event));

        res.json({});
    },
);

/**
 * Leave the currently attended event
 */
router.post('/leave', async (req, res) => {
    const user = req.user!;

    await user.setCurrentEvent(null);

    res.json({});
});

/**
 * Rate an event
 */
router.post(
    '/rate',
    validateBody(z.object({ eventID: z.string().uuid(), rating: z.number().min(1).max(5) })),
    async (req, res) => {
        const user = req.user!;
        const { eventID, rating } = req.body;

        await user.rateEventId(eventID, rating);

        res.json({});
    },
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
 *          displayName: string
 *          avatarHash: string | null
 *      }]
 *      currentAttendees: [{
 *          id: string
 *          username: string
 *          displayName: string
 *          avatarHash: string | null
 *      }]
 *  ]}
 */
// TODO: using request bodies with the GET method is discouraged
router.get(
    '/find',
    validateBody(
        z.object({
            statuses: z.array(z.string()).optional(),
            loadUsers: z.boolean().optional(),
            loadMedia: z.boolean().optional(),
            lat: z.number().optional(),
            lon: z.number().optional(),
            maxRadius: z.number().optional(),
        }),
    ),
    async (req, res) => {
        const { statuses, loadMedia, loadUsers, lat, lon, maxRadius } = req.body;

        let events = await Event.findAll({
            where: {
                status: {
                    [Op.or]: statuses ?? [],
                },
            },
            attributes: { exclude: ['createdAt', 'updatedAt'] },
            include: [
                ...(loadMedia
                    ? [
                          {
                              model: Media,
                              as: 'media',
                              attributes: ['id', 'type', 'fileAvailable', 'userId', 'eventId'],
                          },
                      ]
                    : []),
                ...(loadUsers
                    ? [
                          {
                              model: User,
                              as: 'attendees',
                              attributes: ['id', 'username', 'displayName', 'avatarHash'],
                              through: { as: 'eventAttendee', attributes: ['status'] },
                          },
                      ]
                    : []),
            ],
        });

        if (lat !== undefined && lon !== undefined && maxRadius !== undefined) {
            // filter out events that are too far away
            events = events.filter(
                (event) => haversine(lat, lon, event.lat, event.lon) <= maxRadius,
            );
        }

        res.json({ events: events });
    },
);

/**
 * Find own events, that should be shown on the Events Screen
 *
 * input
 *  {
 *      statuses?: ['scheduled' | 'active' | 'completed']
 *  }
 *
 * returns
 *  { myEvents: [
 *      id: string
 *      name: string
 *      lat: number
 *      lon: number
 *      startDateTime: Date
 *      endDateTime: Date | null
 *  ],
 *  activeEvent: [
 *      id: string
 *      name: string
 *      lat: number
 *      lon: number
 *      startDateTime: Date
 *      endDateTime: Date | null
 *  ],
 *  followedEvents: [
 *      id: string
 *      name: string
 *      lat: number
 *      lon: number
 *      startDateTime: Date
 *      endDateTime: Date | null
 *  ],
 *  followerEvents: [
 *      id: string
 *      name: string
 *      lat: number
 *      lon: number
 *      startDateTime: Date
 *      endDateTime: Date | null
 *  ],
 * }
 */
router.get(
    '/relevantEvents',
    validateBody(
        z.object({
            statuses: z.array(z.string()).optional(),
        }),
    ),
    async (req, res) => {
        const { statuses } = req.body;
        const user = req.user!;

        const [myEvents, currentEvent, followedEvents] = await Promise.all([
            user.getHostedEvents(statuses as EventStatus[]),
            user.getCurrentEvent(),
            user.getFollowedEvents(statuses as EventStatus[]),
        ]);

        const followerEvents: Event[] = [];

        const activeEvent = currentEvent ? [currentEvent] : [];

        res.json({ myEvents, activeEvent, followedEvents, followerEvents });
    },
);

router.post(
    '/getMessages',
    validateBody(
        z.object({
            eventId: z.string(),
        }),
    ),
    async (req, res) => {
        const { eventId } = req.body;

        const messages = await Message.findAll({
            where: {
                eventId: eventId,
            },
        });

        for (const m of messages) {
            const user = await User.findByPk(m.messageCorrespondent);
            m['dataValues']['displayname'] = user?.username;
        }

        res.json({ messages: messages });
    },
);

router.post(
    '/sendMessage',
    validateBody(
        z.object({
            eventId: z.string(),
            messageContent: z.string(),
        }),
    ),
    async (req, res) => {
        const user = req.user!;
        const { eventId, messageContent } = req.body;

        const message = await Message.create({
            eventId: eventId,
            message: messageContent,
            messageCorrespondent: user.id,
        });

        res.json({
            error: false,
        });
    },
);

export default router;
