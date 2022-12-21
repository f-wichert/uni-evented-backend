import assert from 'assert';
import { Request, Response, Router } from 'express';
import fs from 'fs/promises';
import { validate as uuidValidate } from 'uuid';
import config from '../config';
import Media, { MediaType } from '../db/models/media';
import MediaProcessor from '../utils/mediaProcessing';

// TODO: Use multer for file upload

const router = Router();

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

    const media =
        mediaType !== 'avatar'
            ? await Media.create({
                  type: mediaType,
                  userId: user.id,
                  eventId: eventId,
              })
            : undefined;
    const id = media ? media.id : user.id;

    const fileExtension = file.name.substring(file.name.lastIndexOf('.'));
    const uploadPath = `${config.MEDIA_UPLOAD_ROOT}/${id}${fileExtension}`;
    const mediaPath = `${config.MEDIA_ROOT}/${mediaType}/${id}`;

    try {
        await fs.mkdir(mediaPath, { recursive: true });
        await file.mv(uploadPath);
        await mediaProcessor.process(mediaType, id, uploadPath, mediaPath);
    } catch (error) {
        media
            ?.destroy()
            .catch((error) => console.error(`failed to remove ${id}: ${String(error)}`));
        void fs
            .rm(mediaPath, { recursive: true })
            .catch((error) => console.error(`failed to remove ${mediaPath}: ${String(error)}`));
        throw error;
    } finally {
        void fs
            .rm(uploadPath)
            .catch((error) => console.error(`failed to remove ${uploadPath}: ${String(error)}`));
    }

    await media?.update({ fileAvailable: true });
    console.log(`media ${id} now available`);

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

router.post('/avatar', async (req, res) => {
    await handleMediaUpload('avatar', req, res);
});

export default router;
