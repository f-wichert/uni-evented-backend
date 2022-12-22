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

// error handling

// default fallback route, throw 404 error
app.use((req, res, next) => {
    next(httpError.NotFound(`Cannot ${req.method} ${req.path}`));
});

// needs explicit `ErrorRequestHandler` due to https://github.com/DefinitelyTyped/DefinitelyTyped/issues/4212
const errorHandler: ErrorRequestHandler = (err: unknown, req, res, next) => {
    // get stack from error
    let stack: string[] | null = null;
    const stackStr = (err as Error)?.stack;
    if (stackStr && typeof stackStr === 'string') {
        stack = stackStr.split('\n');
    }

    // `setTimeout(..., 0)` to log the error *after* the access log line,
    // instead of before, which would be confusing
    setTimeout(() => console.log(stackStr || err), 0);

    // just forward and do nothing if headers are already set, since it'd be too late to set a status now
    if (res.headersSent) {
        console.warn('Cannot set response code from error, headers were already sent.');
        return next(err);
    }

    const isDev = config.NODE_ENV !== 'production';

    // take code + message from error if possible
    let code = 500;
    let message: string | null = null;
    if (httpError.isHttpError(err)) {
        code = err.statusCode;
        if (err.expose) message = err.message;
    } else if (isDev) {
        message = (err as Error)?.message;
    }

    const body: { error: string; stack?: string[] } = { error: message || 'Internal Server Error' };
    // add stack to response, if not running in production mode
    if (isDev && stack) {
        body.stack = stack;
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
