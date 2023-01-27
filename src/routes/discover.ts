import { Router } from 'express';

import { Op } from 'sequelize';
import Event from '../db/models/event';
import recommendationListForUser from '../recommendationAlgorithm';
import { Coordinates } from '../types';

const router = Router();

router.get('/:lat-:lon', async (req, res) => {
    // Commented out for now, because no events fullfil the requieremnts yet. Returns empty list

    // const events = await Event.findAll({
    // where: {
    //     status: {
    //         [Op.or]: ['scheduled', 'active'],
    //     },
    // },
    //     attributes: { exclude: ['createdAt', 'updatedAt'] },
    //     include: {
    //         model: Media,
    //         as: 'media',
    //         attributes: { exclude: ['createdAt', 'updatedAt'] },
    //         where: {
    //             fileAvailable: true,
    //         },
    //         // only includes events that actually have media
    //         required: true,
    //     },
    // });

    // Use if no events have media
    const events = await Event.findAll({
        where: {
            status: {
                [Op.or]: ['scheduled', 'active'],
            },
        },
    });

    // Use if no events have media
    // const events = await Event.findAll();

    const user = req.user!;
    const userPosition = {
        lat: Number(req.params.lat),
        lon: Number(req.params.lon),
    } as Coordinates;

    const recommendationList = await recommendationListForUser(user, events, userPosition);

    // console.log('DEBUG OUTPUT');
    // console.log(userPosition)
    // console.log(
    //     recommendationList.map((item) => {
    //         return { name: item.event.name, ranking: item.ranking.explanation };
    //     }),
    // );
    // console.log('DEBUG OUTPUT END');

    res.json(recommendationList.map((item) => item.event));
});

export default router;
