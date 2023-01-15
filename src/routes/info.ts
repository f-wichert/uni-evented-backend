import { Router } from 'express';

import Media from '../db/models/media';
import Tag from '../db/models/tag';

const router = Router();

router.get('/all_media', async (req, res) => {
    const media = await Media.findAll();
    res.json({ media: media });
});

router.get('/all_tags', async (req, res) => {
    const allTags = await Tag.findAll();
    res.json(allTags);
});

export default router;
