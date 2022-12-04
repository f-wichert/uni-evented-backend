import { Router } from 'express';

import Media from '../db/models/media';
import { asyncHandler } from '../utils';

const router = Router();

router.get(
    '/all_media',
    asyncHandler(async (req, res) => {
        const media = await Media.findAll();
        res.json({ media: media });
    })
);

export default router;
