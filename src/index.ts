import compression from 'compression';
import express from 'express';
// This patches express to handle async rejections in route handlers,
// avoiding having to wrap everything in `asyncHandler`s.
import 'express-async-errors';

import fileUpload from 'express-fileupload';
import fs from 'fs';
import morgan from 'morgan';
import passport from 'passport';

import config from './config';
import { connect } from './db';
import routes from './routes';

const app = express();

app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(morgan(config.NODE_ENV === 'development' ? 'dev' : 'common'));

app.use(passport.initialize());
app.use(
    fileUpload({
        limits: { fileSize: 50 * 1024 * 1024 },
    }),
);

// mount routers
app.use('/api', routes);

app.get('/', (req, res) => {
    res.json({ status: 'ok' });
});

async function init() {
    await connect();

    // create media directories if they don't exists
    for (const path of [
        config.MEDIA_ROOT + '/video',
        config.MEDIA_ROOT + '/image',
        config.MEDIA_UPLOAD_ROOT,
    ]) {
        await fs.promises.mkdir(path, { recursive: true });
    }

    app.listen(config.PORT, () => {
        console.log(`Server is running at http://localhost:${config.PORT}`);
    });
}

void init();
