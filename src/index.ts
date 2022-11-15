import * as dotenv from 'dotenv';
dotenv.config();

import express, { Express, NextFunction, Request, Response } from 'express';
import { setupDatabase } from './db';
import { User } from './db/models/user';
import { Clip } from './db/models/clip';
import ffmpeg from 'fluent-ffmpeg';
import fileUpload from 'express-fileupload';
import fs from 'fs';
import { create } from 'domain';

/** Properly handles async errors in express routers */
function asyncHandler(fn: (req: Request, res: Response) => Promise<void>) {
    return function (req: Request, res: Response, next: NextFunction): void {
        fn(req, res).catch(next);
    };
}

const MEDIA_ROOT = process.env.MEDIA_ROOT || 'media';
const MEDIA_UPLOAD_ROOT = process.env.MEDIA_UPLOAD_ROOT || 'uploads';
const CLIP_UPLOAD_INPUT_NAME_FIELD = (process.env.CLIP_UPLOAD_INPUT_NAME_FIELD = 'clip');
const FFMPEG_TIMEOUT = Number.parseInt(process.env.FFMPEG_TIMEOUT || '60');

const port = process.env.PORT;

const app: Express = express();
app.use(
    fileUpload({
        limits: { fileSize: 50 * 1024 * 1024 },
    })
);

app.get(
    '/',
    asyncHandler(async (req: Request, res: Response) => {
        await User.create({ firstName: 'Jonas', lastName: 'Test' });

        res.send('<h1> Initial setup </h1>');
    })
);

app.post(
    '/upload',
    asyncHandler(async (req, res) => {
        if (!req.files || !(Object.keys(req.files).length === 1)) {
            console.log('no files uploaded');
            res.status(400).send('no files uploaded');
            return;
        }

        const file = req.files[CLIP_UPLOAD_INPUT_NAME_FIELD];

        if (Array.isArray(file)) {
            console.log('file is array');
            res.status(400).send('file is an array');
            return;
        }

        const clip = await Clip.create();
        const upload_path = `${MEDIA_UPLOAD_ROOT}/${clip.id}`;
        const clip_path = `${MEDIA_ROOT}/clips/${clip.id}`;

        try {
            await createDirectory(clip_path);
        } catch (error) {
            console.log(`something went wrong trying to create dir ${clip_path}: ${error}`);
            await clip.destroy();
            return;
        }

        await file.mv(upload_path);

        ffmpeg(upload_path, { timeout: FFMPEG_TIMEOUT })
            .addOption([
                '-level 3.0',
                `-hls_time ${process.env.CLIP_HLS_SEGMENT_DURATION}`,
                '-hls_list_size 0',
                '-f hls',
            ])
            .size(process.env.CLIP_MAX_RESOLUTION!)
            .output(`${clip_path}/index.m3u8`)
            .on('error', (error) => console.log('ffmpeg error: ', error))
            .on('end', () => {
                console.log('done processing ', upload_path, ' => ', clip_path);
                clip.file_available = true;
                clip.save().then(() => console.log(`clip ${clip.id} now available`));
            })
            .run();

        res.send('');
    })
);

async function createDirectory(path: string) {
    try {
        await fs.promises.access(path);
    } catch (error) {
        // do nothing, directory probably already exists
    }

    try {
        await fs.promises.mkdir(path, { recursive: true });
    } catch (error) {
        throw error;
    }
}

async function init() {
    await setupDatabase();

    // create media directories if they don't exists
    await createDirectory(MEDIA_ROOT + '/clips');
    await createDirectory(MEDIA_UPLOAD_ROOT);

    app.listen(port, () => {
        console.log(`Server is running at http://localhost:${port!}`);
    });
}

void init();
