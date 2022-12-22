import { ErrorRequestHandler } from 'express';
import httpError from 'http-errors';

import config from './config';

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

export default errorHandler;
