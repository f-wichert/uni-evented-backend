import assert from 'assert';
import { Request, Response, Router } from 'express';
import fs from 'fs/promises';
import config from '../config';
import Media, { MediaType } from '../db/models/media';
import MediaProcessor from '../utils/mediaProcessing';

// TODO: Use multer for file upload

const router = Router();

const mediaProcessor = new MediaProcessor();

async function handleMediaUpload(mediaType: MediaType, req: Request, res: Response) {
    assert(req.files && Object.keys(req.files).length === 1, 'No or too many files uploaded');

    const file = req.files[config.UPLOAD_INPUT_NAME_FIELD];
    assert(!Array.isArray(file));

    const user = req.user!;
    const eventId = user.currentEventId;

    assert(eventId, 'user is not attending an event');

    const media = await Media.create({
        type: mediaType,
        userId: user.id,
        eventId: eventId,
    });

    const fileExtension = file.name.substring(file.name.lastIndexOf('.'));
    const uploadPath = `${config.MEDIA_UPLOAD_ROOT}/${media.id}${fileExtension}`;
    const mediaPath = `${config.MEDIA_ROOT}/${mediaType}/${media.id}`;

    try {
        await fs.mkdir(mediaPath, { recursive: true });
        await file.mv(uploadPath);
        await mediaProcessor.process(mediaType, media.id, uploadPath, mediaPath);
    } catch (error) {
        media
            .destroy()
            .catch((error) => console.error(`failed to remove ${media.id}: ${String(error)}`));
        void fs
            .rm(mediaPath, { recursive: true })
            .catch((error) => console.error(`failed to remove ${mediaPath}: ${String(error)}`));
        throw error;
    } finally {
        void fs
            .rm(uploadPath)
            .catch((error) => console.error(`failed to remove ${uploadPath}: ${String(error)}`));
    }

    media.fileAvailable = true;
    await media.save();
    console.log(`media ${media.id} now available`);

    res.send(media);
}

// endpoint accepts a request with a single file
// in a field named config.CLIP_UPLOAD_INPUT_NAME_FIELD
router.post('/clip', async (req, res) => {
    await handleMediaUpload('video', req, res);
});

router.post('/image', async (req, res) => {
    await handleMediaUpload('image', req, res);
});

export default router;
