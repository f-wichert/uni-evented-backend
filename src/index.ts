import compression from 'compression';
import express from 'express';
// This patches express to handle async rejections in route handlers,
// avoiding having to wrap everything in `asyncHandler`s.
import 'express-async-errors';

import fileUpload from 'express-fileupload';
import fs from 'fs/promises';
import httpError from 'http-errors';
import morgan from 'morgan';
import passport from 'passport';

import config from './config';
import { connect } from './db';
import User from './db/models/user';
import errorHandler from './errorHandler';
import routes from './routes';

import nodeMediaServer from './live';

const app = express();

app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(morgan(config.NODE_ENV === 'development' ? 'dev' : 'common'));

app.use(passport.initialize());
app.use(
    fileUpload({
        limits: { fileSize: 50 * 1024 * 1024 },
        abortOnLimit: true,
    }),
);

// mount routers
app.use('/api', routes);

app.use('/media', express.static(config.MEDIA_ROOT));

app.get('/', (req, res) => {
    res.json({ status: 'ok' });
});

app.get('/debug', async (req, res) => {
    const user = await User.findOne({ where: { username: 'Notlorenzo' } });

    const debugValue = await user!.getFollowees();

    console.log('Debug Value: ');
    console.dir(debugValue.map((user) => user.username));
    console.log('End of Debug Value!');
    res.send('Top');
});

// error handling

// default fallback route, throw 404 error
app.use((req, res, next) => {
    next(httpError.NotFound(`Cannot ${req.method} ${req.path}`));
});
// main error handler
app.use(errorHandler);

async function init() {
    await connect();

    // create media directories if they don't exist
    await fs.mkdir(config.MEDIA_UPLOAD_ROOT, { recursive: true });

    nodeMediaServer.run();

    app.listen(config.PORT, () => {
        console.log(`Server is running at http://localhost:${config.PORT}`);
    });
}

void init();
