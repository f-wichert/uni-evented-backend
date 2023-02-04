import assert from 'assert';
import { Router } from 'express';
import httpError from 'http-errors';
import { json, Op } from 'sequelize';
import { z } from 'zod';

import Event, { EventStatuses } from '../db/models/event';
import EventAttendee from '../db/models/eventAttendee';
import EventTags from '../db/models/eventTags';
import Media from '../db/models/media';
import Message from '../db/models/message';
import User from '../db/models/user';
import { distanceInMeters } from '../utils/math';
import { checkProfanity } from '../utils/profanity';
import { dateSchema, validateBody, validateParams } from '../utils/validate';

async function getEventForResponse(id: string) {
    const eventData = await Event.findOne({
        where: { id },
        include: [
            // TODO: remove media from this event object, should be requested separately
            {
                model: Media,
                as: 'media',
                where: { fileAvailable: true },
                required: false,
            },
            {
                model: User,
                as: 'attendees',
                through: { as: 'eventAttendee', attributes: ['status'] },
            },
        ],
    });

    // sort media so livestreams are first,...
    eventData!.media?.sort(sortMedia);

    return eventData;
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

        const ratable = Boolean(
            await EventAttendee.findOne({
                where: {
                    eventId: event.id,
                    userId: req.user!.id,
                    status: { [Op.or]: ['attending', 'left'] },
                },
            }),
        );

        const eventWithRating = {
            ...event.get({ plain: true }),
            rating: await event.getRating(),
            ratable: ratable,
        };
        res.json(eventWithRating);
    },
);

// just doing the sorting with js - also works
const sortMedia = (a: Media, b: Media) => {
    const map = {
        image: 0,
        video: 1,
        livestream: 2,
    };
    if (map[a.type] > map[b.type]) {
        return -1;
    } else if (map[a.type] < map[b.type]) {
        return 1;
    }
    return 0;
};

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
            where: {
                fileAvailable: true,
            },
        });

        media.sort(sortMedia);

        res.json(media.map((m) => m.formatForResponse()));
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

        if (tags?.length)
            await EventTags.bulkCreate(
                tags.map((el) => ({
                    tagId: el,
                    eventId: event.id,
                })),
            );

        // fetch full event from db for consistency
        event = (await getEventForResponse(event.id))!;

        res.json(event);
    },
);

async function startStopEvent(user: User, eventId: string, action: 'start' | 'stop') {
    const event = await Event.findByPk(eventId);

    assert(event, `no event with id: ${eventId}`);
    assert(
        event.hostId === user.id,
        `${user.id} tried to ${action} event ${eventId}, but host is ${event.hostId}`,
    );

    if (action === 'stop') {
        // remove all current attendees from the event
        await EventAttendee.update(
            { status: 'left' },
            { where: { eventId: eventId, status: 'attending' } },
        );
    }

    if (action === 'start') {
        // change host status to attending when starting event
        await EventAttendee.update(
            { status: 'attending' },
            {
                where: {
                    eventId: eventId,
                    userId: event.hostId,
                },
            },
        );
    }

    await (action === 'start' ? event.start() : event.stop());
}

router.post(
    '/stop',
    validateBody(
        z.object({
            eventId: z.string(),
        }),
    ),
    async (req, res) => {
        const user = req.user!;
        const { eventId } = req.body;

        await startStopEvent(user, eventId, 'stop');

        res.json({});
    },
);

router.post(
    '/start',
    validateBody(
        z.object({
            eventId: z.string(),
        }),
    ),
    async (req, res) => {
        const user = req.user!;
        const { eventId } = req.body;

        await startStopEvent(user, eventId, 'start');

        res.json({});
    },
);

async function changeEventUserState(
    user: User,
    eventId: string,
    action: 'join' | 'follow' | 'unfollow',
) {
    assert(action !== 'join' || !(await user.getCurrentEventId()));

    const event = await Event.findByPk(eventId);

    assert(event);

    // TODO: implement more join conditions (maxAttendees, etc.)

    switch (action) {
        case 'join':
            await user.setCurrentEvent(event);
            break;
        case 'follow':
            await user.followEvent(event);
            break;
        case 'unfollow':
            await user.unfollowEvent(event);
            break;
    }
}

/**
 * Join an event
 *
 * input
 *  {
 *      eventId: string
 *  }
 */
router.post(
    '/join',
    validateBody(
        z.object({
            eventId: z.string(),
        }),
    ),
    async (req, res) => {
        const user = req.user!;
        const { eventId } = req.body;

        try {
            await changeEventUserState(user, eventId, 'join');
        } catch (err) {
            res.status(404).json({
                message: "You can't join two events at the same time. Leave the other event first.",
            });
            return;
        }

        res.json({});
    },
);

/**
 * Follow an event
 *
 * input
 *  {
 *      eventId: string
 *  }
 */
router.post(
    '/follow',
    validateBody(
        z.object({
            eventId: z.string(),
        }),
    ),
    async (req, res) => {
        const user = req.user!;
        const { eventId } = req.body;

        // TODO: make configurable?
        // const maxEventDistance = 10.0;
        // assert(distanceInMeters(lat, lon, event.lat, event.lon) <= maxEventDistance);
        await changeEventUserState(user, eventId, 'follow');

        res.json({});
    },
);

/**
 * Unfollow an event
 *
 * input
 *  {
 *      eventId: string
 *  }
 */
router.post(
    '/unfollow',
    validateBody(
        z.object({
            eventId: z.string(),
        }),
    ),
    async (req, res) => {
        const user = req.user!;
        const { eventId } = req.body;

        await changeEventUserState(user, eventId, 'unfollow');

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
    validateBody(z.object({ eventId: z.string().uuid(), rating: z.number().min(1).max(5) })),
    async (req, res) => {
        const user = req.user!;
        const { eventId, rating } = req.body;

        await user.rateEventId(eventId, rating);

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
 *  ]}
 */
// TODO: using request bodies with the GET method is discouraged
router.get(
    '/find',
    validateBody(
        z.object({
            statuses: z.array(z.string()).optional(),
            loadMedia: z.boolean().optional(),
            lat: z.number().optional(),
            lon: z.number().optional(),
            maxRadius: z.number().optional(),
        }),
    ),
    async (req, res) => {
        const { statuses, loadMedia, lat, lon, maxRadius } = req.body;

        let events = await Event.findAll({
            where: {
                status: {
                    [Op.or]: statuses ?? [],
                },
            },
            include: [
                // TODO: remove media from this event object, it should be requested separately
                {
                    model: Media,
                    as: 'media',
                },
                {
                    model: User,
                    as: 'attendees',
                    through: { as: 'eventAttendee', attributes: ['status'] },
                },
            ],
        });

        if (lat !== undefined && lon !== undefined && maxRadius !== undefined) {
            // filter out events that are too far away
            events = events.filter(
                (event) =>
                    distanceInMeters({ lat: lat, lon: lon }, { lat: event.lat, lon: event.lon }) <=
                    maxRadius,
            );
        }

        const rawEvents = events.map((e) => ({
            // don't question it, it just works :tm:
            ...e.get({ plain: true }),
            livestream: !!e.media?.find((m) => m.type === 'livestream' && m.fileAvailable),
            ...(!loadMedia ? { media: undefined } : undefined),
        }));

        res.json(rawEvents);
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
 *  {
 *    // events hosted by current user
 *    hostedEvents: Event[],
 *    // event that the user is currently attending (status: 'attending')
 *    currentEvent: Event | null,
 *    // events the user is interested in (status: 'interested')
 *    interestedEvents: Event[],
 *    // past events (status: 'left')
 *    pastEvents: Event[],
 *  }
 */
router.get(
    '/relevantEvents',
    validateBody(
        z.object({
            statuses: z.array(z.enum(EventStatuses)).optional(),
        }),
    ),
    async (req, res) => {
        const { statuses } = req.body;
        const user = req.user!;

        const result = await Promise.all([
            user.getHostedEvents(statuses),
            user.getCurrentEvent(),
            user.getEventsWithAttendeeStatus('interested', statuses),
            user.getEventsWithAttendeeStatus('left', statuses),
        ]);

        // nice - fix linter
        const [hostedEvents, currentEvent, , pastEvents] = result;
        let [, , interestedEvents] = result;

        const followerEvents: Event[] = [];

        const activeEvent = currentEvent ? [currentEvent] : [];

        // filter events from followedEvents that are already in HostedEvents
        const myEventIds = hostedEvents.map((el) => el.id);
        interestedEvents = interestedEvents.filter((el) => !myEventIds.includes(el.id));

        res.json({ hostedEvents, currentEvent, interestedEvents, pastEvents });
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
            include: [
                {
                    model: User,
                    as: 'sender',
                },
            ],
        });

        res.json(messages);
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

        const profMsg = messageContent
            .split(' ')
            .map((word) => {
                if (checkProfanity(word)) {
                    return '*'.repeat(word.length);
                } else return word;
            })
            .join(' ');

        // create message
        const msg = await Message.create({
            eventId: eventId,
            message: profMsg,
            senderId: user.id,
        });

        // send push notifications
        const event = await Event.findByPk(eventId);
        if (!event) throw new httpError.NotFound();

        await event.notifyAttendees(
            ['attending'],
            {
                title: `${user.getName()} (${event.name})`,
                body: msg.message,
            },
            { includeHost: true, excludeIDs: [user.id] },
        );

        res.json({});
    },
);

router.post(
    '/banFromEvent',
    validateBody(
        z.object({
            eventId: z.string(),
            userId: z.string(),
        }),
    ),
    async (req, res) => {
        const user = req.user!;
        const { eventId, userId } = req.body;

        const event = await Event.findByPk(eventId);

        // only host should be able users from his event / or is user is admin
        assert(event?.hostId === user.id || user.isAdmin, 'Not authorized to ban user');

        await EventAttendee.update(
            { status: 'banned' },
            {
                where: {
                    eventId: eventId,
                    userId: userId,
                },
            },
        );

        res.json({});
    },
);

router.post(
    '/update/:eventId',
    validateBody(
        z.object({
            name: z.string(),
            lat: z.number(),
            lon: z.number(),
            startDateTime: dateSchema.nullish(),
            endDateTime: dateSchema.nullish(),
            description: z.string(),
            tags: z.array(z.string()),
        }),
    ),
    async (req, res) => {
        const eventId = req.params.eventId;
        console.log('Received Event Body: ');
        console.log(req.body);
        console.log('End of Request Body');

        const user = req.user!;
        const { name, lat, lon, startDateTime, endDateTime, tags, description } = req.body;
        const actualStartDateTime = startDateTime ?? new Date();

        // TODO: more validation
        assert(!endDateTime || actualStartDateTime < endDateTime, 'start time is after end time');

        const eventToBeUpdated = (await Event.findByPk(eventId))!;

        const event = await eventToBeUpdated.update({
            name: name,
            lat: lat,
            lon: lon,
            startDateTime: actualStartDateTime,
            endDateTime: endDateTime,
            hostId: user.id,
            description: description,
        });

        await EventTags.destroy({
            where: {
                eventId: eventId,
            },
        });

        if (tags?.length) {
            await EventTags.bulkCreate(
                tags.map((el) => ({
                    tagId: el,
                    eventId: event.id,
                })),
            );
        }

        const fetchedEvent = (await getEventForResponse(eventId))!;
        // return full event
        res.send(json(fetchedEvent));
    },
);
export default router;
