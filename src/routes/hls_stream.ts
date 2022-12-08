import { Router } from 'express';
import { default as fsSync } from 'fs';
import fs from 'fs/promises';
import { extname } from 'path';

import config from '../config';

const router = Router();

router.get('/:UUID/:filename', async (req, res) => {
    const filename: string =
        config.MEDIA_ROOT + '/video/' + req.params.UUID + '/' + req.params.filename;

    // check if the file exists
    try {
        await fs.access(filename, fs.constants.R_OK);
    } catch {
        res.sendStatus(404);
        return;
    }

    console.log('sending file: ' + filename);
    const ext = extname(filename);
    switch (ext) {
        case '.m3u8': {
            const contents = await fs.readFile(filename);
            if (!contents.length) {
                throw new Error(`Empty playlist file: ${filename}`);
            }
            res.header('Content-Type', 'application/vnd.apple.mpegurl');
            res.send(contents);
            break;
        }
        case '.ts':
            res.header('Content-Type', 'video/MP2T');
            fsSync.createReadStream(filename).pipe(res);
            break;
        default:
            throw new Error(`Unknown file type: ${ext}`);
    }
});

export default router;
