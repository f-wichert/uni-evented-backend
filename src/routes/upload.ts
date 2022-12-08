import assert from 'assert';
import { Request, Router } from 'express';
import fs from 'fs';
import config from '../config';
import Media, { MediaType } from '../db/models/media';
import MediaProcessor, { ClipQuality, ImageQuality } from '../utils/mediaProcessing';

// TODO: Use multer for file upload

const router = Router();

const CLIP_QUALITIES = [
    new ClipQuality(480, 854, 600, 32, 44100, 1),
    new ClipQuality(720, 1280, 1500, 64, 44100, 2),
];

const IMAGE_QUALITIES = [
    new ImageQuality('high', 1080, 1920),
    new ImageQuality('medium', 720, 1280),
    new ImageQuality('low', 480, 854),
];

const mediaProcessor = new MediaProcessor();

async function handleMediaUpload(mediaType: MediaType, req: Request) {
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
        await fs.promises.mkdir(mediaPath, { recursive: true });
        await file.mv(uploadPath);
        await mediaProcessor.process(
            mediaType,
            media.id,
            uploadPath,
            mediaPath,
            mediaType === 'video' ? CLIP_QUALITIES : IMAGE_QUALITIES,
        );
    } catch (error) {
        media
            .destroy()
            .catch((error) => console.error(`failed to remove ${media.id}: ${String(error)}`));
        void fs.promises
            .rm(mediaPath, { recursive: true })
            .catch((error) => console.error(`failed to remove ${mediaPath}: ${String(error)}`));
        throw error;
    } finally {
        void fs.promises
            .rm(uploadPath)
            .catch((error) => console.error(`failed to remove ${uploadPath}: ${String(error)}`));
    }

    media.fileAvailable = true;
    media
        .save()
        .then(() => console.log(`media ${media.id} now available`))
        .catch((error) => console.error(`failed to save media ${media.id}: ${String(error)}`));
}

// endpoint accepts a request with a single file
// in a field named config.CLIP_UPLOAD_INPUT_NAME_FIELD
router.post('/clip', async (req, res) => {
    await handleMediaUpload('video', req);
    res.send('ok!');
});

router.post('/image', async (req, res) => {
    await handleMediaUpload('image', req);
    res.send('ok!');
});

export default router;
