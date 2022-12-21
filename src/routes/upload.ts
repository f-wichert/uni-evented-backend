import assert from 'assert';
import { Request, Response, Router } from 'express';
import fs from 'fs/promises';
import { validate as uuidValidate } from 'uuid';
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

async function handleMediaUpload(mediaType: MediaType, req: Request, res: Response) {
    assert(req.files && Object.keys(req.files).length === 1, 'No or too many files uploaded');
    assert(
        uuidValidate(req.params.eventID),
        'Given Event-UUID for media upload was not a valid UUID!',
    );

    const file = req.files[config.UPLOAD_INPUT_NAME_FIELD];
    assert(!Array.isArray(file));

    const user = req.user!;
    const eventId = req.params.eventID;

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
router.post('/clip/:eventID', async (req, res) => {
    console.log('Trying to save clip');
    await handleMediaUpload('video', req, res);
});

router.post('/image/:eventID', async (req, res) => {
    await handleMediaUpload('image', req, res);
});

export default router;
