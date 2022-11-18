import { Router } from 'express';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import { z } from 'zod';
import config from '../config';
import { Clip } from '../db/models/clip';
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
            res.status(400).send('no or too many files uploaded');
            return;
        }

        const file = req.files[config.CLIP_UPLOAD_INPUT_NAME_FIELD];

        if (Array.isArray(file)) {
            res.status(400).send('file is an array');
            return;
        }

        const clip = await Clip.create();
        const upload_path = `${config.MEDIA_UPLOAD_ROOT}/${clip.id}`;
        const clip_path = `${config.MEDIA_ROOT}/clips/${clip.id}`;

        try {
            await fs.promises.mkdir(clip_path, { recursive: true });
        } catch (error) {
            console.error(
                `something went wrong trying to create dir ${clip_path}: ${String(error)}`
            );
            res.status(400).send('');
            await clip.destroy();
            return;
        }

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
