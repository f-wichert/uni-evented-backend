import { Request, Router } from 'express';
import { UploadedFile } from 'express-fileupload';
import fs from 'fs/promises';
import httpError from 'http-errors';
import path from 'path';
import { z } from 'zod';

import config from '../config';
import Media, { MediaType } from '../db/models/media';
import MediaProcessor from '../utils/mediaProcessing';
import { validateBody } from '../utils/validate';

// TODO: Use multer for file upload

const router = Router();

const mediaProcessor = new MediaProcessor();

function getFile(req: Request): UploadedFile {
    if (req.files && Object.keys(req.files).length === 1) {
        const file = req.files[config.UPLOAD_INPUT_NAME_FIELD];
        if (!Array.isArray(file)) {
            return file;
        }
    }

    throw httpError.BadRequest('No or too many files uploaded');
}

async function processFile(
    file: UploadedFile,
    mediaType: MediaType | 'avatar',
    id: string,
): Promise<void> {
    const uploadFilePath = `${config.MEDIA_UPLOAD_ROOT}/${id}${path.extname(file.name)}`;
    const mediaDirPath = `${config.MEDIA_ROOT}/${mediaType}/${id}`;

    try {
        // create final directory
        await fs.mkdir(mediaDirPath, { recursive: true });
        // move (ephemeral) uploaded file to temporary location
        await file.mv(uploadFilePath);
        // process uploaded file
        await mediaProcessor.process(mediaType, id, uploadFilePath, mediaDirPath);
    } catch (error) {
        // try to remove the directory we created
        fs.rm(mediaDirPath, { recursive: true }).catch((error) =>
            console.error(`failed to remove ${mediaDirPath}: ${String(error)}`),
        );
        // re-throw error
        throw error;
    } finally {
        // always cleanup the temporary file
        fs.rm(uploadFilePath).catch((error) =>
            console.error(`failed to remove ${uploadFilePath}: ${String(error)}`),
        );
    }

    console.log(`media ${id} (${mediaType}) now available`);
}

async function processMediaFile(
    file: UploadedFile,
    mediaType: MediaType,
    userId: string,
    eventId: string,
): Promise<Media> {
    // create entry in database
    // TODO: check if user is attendee of event
    const media = await Media.create({
        type: mediaType,
        userId: userId,
        eventId: eventId,
    });

    try {
        await processFile(file, mediaType, media.id);
    } catch (error) {
        // if something went wrong while processing, remove created db entry again
        media
            .destroy()
            .catch((error) =>
                console.error(`failed to remove media entry ${media.id}: ${String(error)}`),
            );
        throw error;
    }

    // at this point, the file was processed and is available
    await media.update({ fileAvailable: true });
    return media;
}

// endpoint accepts a request with a single file
// in a field named config.CLIP_UPLOAD_INPUT_NAME_FIELD
router.post('/clip', validateBody(z.object({ eventID: z.string().uuid() })), async (req, res) => {
    const file = getFile(req);
    const media = await processMediaFile(file, 'video', req.user!.id, req.body.eventID);
    res.json(media);
});

router.post('/image', validateBody(z.object({ eventID: z.string().uuid() })), async (req, res) => {
    const file = getFile(req);
    const media = await processMediaFile(file, 'image', req.user!.id, req.body.eventID);
    res.json(media);
});

router.post('/avatar', async (req, res) => {
    const file = getFile(req);
    await processFile(file, 'avatar', req.user!.id);
    res.json({});
});

export default router;
