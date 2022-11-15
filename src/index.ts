import * as dotenv from 'dotenv';
dotenv.config();

import express, { Express, NextFunction, Request, Response } from 'express';
import { setupDatabase } from './db';
import { User } from './db/models/user';
import ffmpeg from 'fluent-ffmpeg';

/** Properly handles async errors in express routers */
function asyncHandler(fn: (req: Request, res: Response) => Promise<void>) {
    return function (req: Request, res: Response, next: NextFunction): void {
        fn(req, res).catch(next);
    };
}

const app: Express = express();
const port = process.env.PORT;

app.get(
    '/',
    asyncHandler(async (req: Request, res: Response) => {
        await User.create({ firstName: 'Jonas', lastName: 'Test' });

        res.send('<h1> Initial setup </h1>');
    })
);

app.get('/upload', (req, res) => {
    console.log('lol');
    ffmpeg('uploads/input.mp4', { timeout: 20 })
        .addOptions([
            '-level 3.0',
            '-s 640x360',          // 640px width, 360px height output video dimensions
            '-hls_time 1',        // 10 second segment duration
            '-hls_list_size 0',    // Maxmimum number of playlist entries (0 means all entries/infinite)
            '-f hls', // HLS format
        ])
        .output('uploads/output.m3u8')
        .on('end', () => console.log('test'))
        .run();
    res.send('');
});

async function init() {
    await setupDatabase();

    app.listen(port, () => {
        console.log(`Server is running at https://localhost:${port!}`);
    });
}

void init();
