import { Router } from 'express';

import { Op } from 'sequelize';
import { z } from 'zod';
import Event from '../db/models/event';
import Media from '../db/models/media';
import recommendationListForUser from '../recommendationAlgorithm';
import { Coordinates } from '../types';
import { validateBody } from '../utils/validate';

const router = Router();

router.get(
    '/',
    validateBody(z.object({ lat: z.number().min(0).max(90), lon: z.number().min(0).max(90) })),
    async (req, res) => {
        // Commented out for now, because no events fullfil the requieremnts yet. Returns empty list

        const events = await Event.findAll({
            where: {
                status: {
                    [Op.or]: ['scheduled', 'active'],
                },
            },
            attributes: { exclude: ['createdAt', 'updatedAt'] },
            include: {
                model: Media,
                as: 'media',
                attributes: { exclude: ['createdAt', 'updatedAt'] },
                where: {
                    fileAvailable: true,
                },
                // only includes events that actually have media
                required: true,
            },
        });

        // Use if no events have media
        // const events = await Event.findAll();

        const user = req.user!;
        const userPosition = {
            lat: req.body.lat,
            lon: req.body.lon,
        } as Coordinates;

        console.log('DEBUG OUTPUT');
        console.log(
            (await recommendationListForUser(user, events, userPosition)).map((event) => {
                return { name: event.event.name, ranking: event.ranking.explanation };
            }),
        );
        console.log('DEBUG OUTPUT END');

        res.json(events);
    },
);

export default router;
