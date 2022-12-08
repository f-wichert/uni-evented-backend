import { Router } from 'express';

import Media from '../db/models/media';

const router = Router();

router.get(
    '/all_media',
    async (req, res) => {
        const media = await Media.findAll();
        res.json({ media: media });
    },
);

export default router;
