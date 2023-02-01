import assert from 'assert';
import { Request, Router } from 'express';
import { UploadedFile } from 'express-fileupload';
import fs from 'fs/promises';
import httpError from 'http-errors';
import path from 'path';
import { Op } from 'sequelize';
import { z } from 'zod';

import config from '../config';
import Media, { MediaType } from '../db/models/media';
import MediaProcessor from '../utils/mediaProcessing';
import { validateBody } from '../utils/validate';

// TODO: Use multer for file upload

const router = Router();

function getFile(req: Request): UploadedFile {
    if (req.files && Object.keys(req.files).length === 1) {
        const file = req.files[config.UPLOAD_INPUT_NAME_FIELD];
        if (!Array.isArray(file)) {
            return file;
        }
    }

    throw httpError.BadRequest('No or too many files uploaded');
}

async function processFile(file: UploadedFile, mediaType: MediaType, id: string): Promise<void> {
    const uploadFilePath = `${config.MEDIA_UPLOAD_ROOT}/${id}${path.extname(file.name)}`;

    try {
        await MediaProcessor.handleUpload(mediaType, id, async (outputDir) => {
            // move (ephemeral) uploaded file to temporary location
            await fs.mkdir(path.dirname(uploadFilePath), { recursive: true });
            await file.mv(uploadFilePath);
            // process uploaded file
            await MediaProcessor.process(mediaType, id, uploadFilePath, outputDir);
        });
    } finally {
        // always cleanup the temporary file
        fs.rm(uploadFilePath).catch((error) =>
            console.error(`failed to remove ${uploadFilePath}: ${String(error)}`),
        );
    }
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
    res.json(media.formatForResponse());
});

router.post('/image', validateBody(z.object({ eventID: z.string().uuid() })), async (req, res) => {
    const file = getFile(req);
    const media = await processMediaFile(file, 'image', req.user!.id, req.body.eventID);
    res.json(media.formatForResponse());
});

/**
 * Indicate that a livestream will start
 * The rtmp address for the livestream will be
 * `rtmp://{ip}:{NMS_RTMP_PORT}/live/{media.id}?key={media.streamKey}`
 */
router.post(
    '/livestream',
    validateBody(z.object({ eventID: z.string().uuid() })),
    async (req, res) => {
        const user = req.user!;
        const { eventID } = req.body;

        assert((await user.getCurrentEventId()) === eventID);

        const media =
            (await Media.scope('full').findOne({
                where: {
                    type: 'livestream',
                    userId: user.id,
                    eventId: eventID,
                    streamKey: { [Op.not]: null },
                },
            })) ??
            (await Media.create({
                type: 'livestream',
                userId: user.id,
                eventId: eventID,
            }));

        res.json(media.formatForResponse({ livestreamCreation: true }));
    },
);

export default router;
