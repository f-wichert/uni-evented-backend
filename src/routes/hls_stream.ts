import { Router } from 'express';
import fs from 'fs';
import { extname } from 'path';

const router = Router();

router.get('/:UUID/:filename', (req, res) => {
    const filename: string =
        process.env.MEDIA_ROOT! + '/video' + '/' + req.params.UUID + '/' + req.params.filename;

    fs.exists(filename, function (exists) {
        if (!exists) {
            console.log('file not found: ' + filename);
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.write(`file not found: %s\n${filename}`);
            res.end();
        } else {
            console.log('sending file: ' + filename);
            switch (extname(filename)) {
                case '.m3u8':
                    fs.readFile(filename, function (err, contents) {
                        if (err) {
                            res.writeHead(500);
                            res.end();
                        } else if (contents) {
                            res.writeHead(200, {
                                'Content-Type': 'application/vnd.apple.mpegurl',
                                'Access-Control-Allow_Origin': '*',
                            });
                            res.end(contents, 'utf-8');
                        } else {
                            console.log('emptly playlist');
                            res.writeHead(500);
                            res.end();
                        }
                    });
                    break;
                case '.ts':
                    res.writeHead(200, {
                        'Content-Type': 'video/MP2T',
                        'Access-Control-Allow_Origin': '*',
                    });
                    fs.createReadStream(filename).pipe(res);
                    break;
                default:
                    console.log('unknown file type: ' + extname(filename));
                    res.writeHead(500);
                    res.end();
            }
        }
    });
});

export default router;
