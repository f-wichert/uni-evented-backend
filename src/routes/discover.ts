import { Router } from 'express';

import Event from '../db/models/event';
import User from '../db/models/user';
import recommendationListForUser from '../recommendationAlgorithm';

const router = Router();

router.get('/', async (req, res) => {
    // Commented out for now, because no events fullfil the requieremnts yet. Returns empty list

    // const events = await Event.findAll({
    //     where: {
    //         status: {
    //             [Op.or]: ['scheduled', 'active'],
    //         },
    //     },
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

    const events = await Event.findAll();

    const testUser = await User.findOne();

    console.log('DEBUG OUTPUT');
    console.log(
        recommendationListForUser(testUser!, events).map((event) => {
            return { name: event.event.name, ranking: event.ranking };
        }),
    );
    console.log('DEBUG OUTPUT END');

    res.json(events);
});

export default router;
