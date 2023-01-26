import { Router } from 'express';

import Tag from '../db/models/tag';

const router = Router();

router.get('/all_tags', async (req, res) => {
    const allTags = await Tag.findAll();
    res.json(allTags);
});

export default router;
