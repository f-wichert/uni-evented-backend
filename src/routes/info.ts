import { Router } from 'express';

import Media from '../db/models/media';

const router = Router();

<<<<<<< HEAD
router.get(
    '/all_media',
    asyncHandler(async (req, res) => {
        const media = await Media.findAll();
        console.log(`Media: ${media}`)
        res.json({ media: media });
    })
);
=======
router.get('/all_media', async (req, res) => {
    const media = await Media.findAll();
    res.json({ media: media });
});
>>>>>>> cdb91aa5fa115075d90812e8f9a9d6aa5d678c4a

export default router;
