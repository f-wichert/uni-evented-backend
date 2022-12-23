import compression from 'compression';
import express, { ErrorRequestHandler } from 'express';
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
import Event from './db/models/event';
import User from './db/models/user';
import routes from './routes';

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
    const _ = await Event.findAll({ include: [{ model: User, as: 'attendees' }] });
    const user = _[1];
    const debugValue = user.attendees?.length;
    console.dir(debugValue);
    res.send('Top');
});

// error handling

// default fallback route, throw 404 error
app.use((req, res, next) => {
    next(httpError.NotFound(`Cannot ${req.method} ${req.path}`));
});

// needs explicit `ErrorRequestHandler` due to https://github.com/DefinitelyTyped/DefinitelyTyped/issues/4212
const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
    // just forward and do nothing if headers are already set, since it'd be too late to set a status now
    if (res.headersSent) return next(err);

    // take code + message from error if possible
    let code = 500;
    let message = 'Internal Server Error';
    if (httpError.isHttpError(err)) {
        code = err.statusCode;
        message = err.message;
    }

    const body: { error: string; stack?: string[] } = { error: message };

    // add stack to response, if not running in production mode
    const stack = (err as Error).stack;
    if (config.NODE_ENV !== 'production' && stack && typeof stack === 'string') {
        body.stack = stack.split('\n');
    }

    res.status(code).json(body);
};
app.use(errorHandler);

async function init() {
    await connect();

    // create media directories if they don't exist
    await fs.mkdir(config.MEDIA_UPLOAD_ROOT, { recursive: true });

    app.listen(config.PORT, () => {
        console.log(`Server is running at http://localhost:${config.PORT}`);
    });
}

void init();
