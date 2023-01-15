import { Router } from 'express';

import { Op } from 'sequelize';
import Event from '../db/models/event';
import Media from '../db/models/media';
import User from '../db/models/user';
import recommendationListForUser from '../recommendationAlgorithm';

const router = Router();

router.get('/', async (req, res) => {
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

    const testUser = await User.findOne({ where: { username: 'Lorenzo' } });

    console.log('DEBUG OUTPUT');
    console.log(
        (await recommendationListForUser(testUser!, events)).map((event) => {
            return { name: event.event.name, ranking: event.ranking.explanation };
        }),
    );
    console.log('DEBUG OUTPUT END');

    res.json(events);
});

export default router;
