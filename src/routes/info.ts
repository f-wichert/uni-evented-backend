import { Router } from 'express';

import { Clip } from '../db/models/clip';
import { asyncHandler } from '../utils';

const router = Router();

router.get(
    '/all_clips',
    asyncHandler(async (req, res) => {
        const clips = await Clip.findAll();
        res.send(clips);
    })
);

export default router;
