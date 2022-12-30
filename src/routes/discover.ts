import { Router } from 'express';
import { Op } from 'sequelize';

import Event from '../db/models/event';
import Media from '../db/models/media';

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

    res.json(events);
});

export default router;
