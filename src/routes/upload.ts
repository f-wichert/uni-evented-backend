import { Router } from 'express';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import { z } from 'zod';
import config from '../config';
import { Clip } from '../db/models/clip';
import { Event } from '../db/models/event';
import { requireAuth } from '../passport';
import { asyncHandler } from '../utils';
import { validateBody } from '../utils/validate';

const router = Router();

router.post(
    '/clip',
    requireAuth,
    validateBody(z.object({ eventId: z.string() })),
    asyncHandler(async (req, res) => {
        if (!req.files || !(Object.keys(req.files).length === 1)) {
            throw Error('No or too many files uploaded');
        }

        const file = req.files[config.CLIP_UPLOAD_INPUT_NAME_FIELD];

        if (Array.isArray(file)) {
            throw Error(`File is an Array`);
        }

        const clip = await Clip.create();
        const upload_path = `${config.MEDIA_UPLOAD_ROOT}/${clip.id}`;
        const clip_path = `${config.MEDIA_ROOT}/clips/${clip.id}`;

        try {
            await fs.promises.mkdir(clip_path, { recursive: true });
        } catch (error) {
            await clip.destroy();
            throw Error(`Couldnt create clip directory: ${String(error)}`);
        }

        const user = req.user!;

        // TODO: get the currently attended event directly from the user
        const event = await Event.findOne({ where: { id: req.body.eventId } });
        if (!event) {
            await clip.destroy();
            throw Error('specified event doesnt exist');
        }

        clip.eventId = event.id;
        clip.uploaderId = user.id;
        await clip.save();

        await file.mv(upload_path);

        ffmpeg(upload_path, { timeout: config.FFMPEG_TIMEOUT })
            .addOption([
                '-level 3.0',
                `-hls_time ${config.CLIP_HLS_SEGMENT_DURATION}`,
                '-hls_list_size 0',
                '-f hls',
            ])
            .size(config.CLIP_MAX_RESOLUTION)
            .output(`${clip_path}/index.m3u8`)
            .on('error', (error) => console.log('ffmpeg error: ', error))
            .on('end', () => {
                console.log('done processing ', upload_path, ' => ', clip_path);
                clip.file_available = true;
                clip.save()
                    .then(() => console.log(`clip ${clip.id} now available`))
                    .catch(() => console.error(`Error trying to save clip ${clip.id}`));
            })
            .run();

        res.send('');
    })
);

export default router;
