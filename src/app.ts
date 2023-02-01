import express from 'express';
// This patches express to handle async rejections in route handlers,
// avoiding having to wrap everything in `asyncHandler`s.
import 'express-async-errors';

import compression from 'compression';
import fileUpload from 'express-fileupload';
import httpError from 'http-errors';
import morgan from 'morgan';
import passport from 'passport';

import config from './config';
import errorHandler from './errorHandler';
import routes from './routes';

export const app = express();

app.use(compression());
app.use(express.json({ limit: '1mb' }));
if (config.NODE_ENV !== 'test')
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
// main error handler
app.use(errorHandler);
