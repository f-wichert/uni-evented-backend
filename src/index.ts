import express from 'express';

import fileUpload from 'express-fileupload';
import fs from 'fs';
import passport from 'passport';
import config from './config';
import { connect } from './db';
import { User } from './db/models/user';
import routes from './routes';
import { asyncHandler } from './utils';

const app = express();

// TODO: csrf and other middlewares
app.use(express.json());
app.use(passport.initialize());
app.use(
    fileUpload({
        limits: { fileSize: 50 * 1024 * 1024 },
    })
);

// mount routers
app.use('/api', routes);

app.get(
    '/',
    asyncHandler(async (req, res) => {
        console.log(await User.findAll());

        res.json({ things: 'stuff' });
    })
);

app.get('/debugPlayer', (req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' });
		res.write('<html><head><title>HLS Player fed by node.js' +
		    '</title></head><body>');
		res.write('<video src="http://' + 'localhost' +
		    ':' + process.env.PORT + '/api/hls/b3b5c206-6fd7-426e-b6c0-8a64bd9a2342/output.m3u8" controls></body></html>');
		res.end();
});

async function init() {
    await connect();
    // console.log(hlsserver)
    // create media directories if they don't exists
    await fs.promises.mkdir(config.MEDIA_ROOT + '/clips', { recursive: true });
    await fs.promises.mkdir(config.MEDIA_UPLOAD_ROOT, { recursive: true });

    app.listen(config.PORT, () => {
        console.log(`Server is running at http://localhost:${config.PORT}`);
    });
    console.log("finished Setup")
}

void init();
