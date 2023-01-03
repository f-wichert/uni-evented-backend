import { Router } from 'express';
import { Op } from 'sequelize';

import recommendationListForUser from '../recommendationAlgorithm';
import Event from '../db/models/event';
import Media from '../db/models/media';
import User from '../db/models/user';

const router = Router();

router.get('/', async (req, res) => {
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

    const testUser = await User.findOne()

    console.log(recommendationListForUser(testUser!))

    res.json(events);
});

export default router;
