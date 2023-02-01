import { ErrorRequestHandler } from 'express';
import httpError from 'http-errors';
import { ValidationError as SequelizeValidationError } from 'sequelize';
import statuses from 'statuses';

import config from './config';
import { RequestValidationError } from './utils/validate';

/**
 * Essentially a replacement for express's builtin error handler,
 * with several improvements:
 * - json responses
 * - usage of `http-errors`
 * - special casing for sequelize + zod errors
 * - probably other things
 *
 * ˢᵉⁿᵈ ʰᵉˡᵖ
 */

const isDev = config.NODE_ENV === 'development';

function getMessage(err: unknown): string | null {
    if (err instanceof SequelizeValidationError) {
        return err.errors.map((e) => `${e.type || e.origin}: ${e.message}`).join(',\n');
    } else if (err instanceof RequestValidationError) {
        return `Invalid request ${err.field}: ${JSON.stringify(err.parent.format())}`;
    }
    return (err as Error)?.message ?? null;
}

function getLogMessage(err: unknown, message: string | null, stack: string[] | null) {
    message = message || String(err);
    if (err instanceof RequestValidationError) {
        return message;
    } else {
        return stack?.join('\n') || message;
    }
}

function getStack(err: unknown, message: string | null): string[] | null {
    const stackStr = (err as Error)?.stack;
    if (!stackStr || typeof stackStr !== 'string') return null;

    // replace first line of stack with message, if applicable
    const stack = stackStr.split('\n');
    if (message) stack[0] = `${(err as Error)?.name || 'Error'}: ${message}`;
    return stack;
}

function getResponseCode(err: unknown): number {
    if (httpError.isHttpError(err)) {
        return err.statusCode;
    } else if (err instanceof RequestValidationError) {
        return 422;
    }
    return 500;
}

function getResponseErrorData(err: unknown, message: string | null): string | object | null {
    if (
        // if we're running in production ...
        !isDev &&
        // ... and the error isn't explicitly meant to be shown ...
        !(httpError.isHttpError(err) && err.expose)
    )
        // ... return nothing
        return null;

    if (err instanceof RequestValidationError) {
        // add full validation error data as json
        return { [err.field]: err.parent.format() };
    }
    return message;
}

// needs explicit `ErrorRequestHandler` due to https://github.com/DefinitelyTyped/DefinitelyTyped/issues/4212
const errorHandler: ErrorRequestHandler = (err: unknown, req, res, next) => {
    const message = getMessage(err);
    const stack = getStack(err, message);

    // `setTimeout(..., 0)` to log the error *after* the access log line,
    // instead of before, which would be confusing
    setTimeout(() => console.log(getLogMessage(err, message, stack)), 0);

    // just forward and do nothing if headers are already set, since it'd be too late to set a status now
    if (res.headersSent) {
        console.warn('Cannot set response code from error, headers were already sent.');
        return next(err);
    }

    const code = getResponseCode(err);
    const body: { error: string | object; stack?: string[] } = {
        error:
            getResponseErrorData(err, message) || statuses.message[code] || 'Internal Server Error',
    };

    // if not running in production mode, and we don't yet have detailed error info, add stack to response
    if (isDev && typeof body.error === 'string' && stack) {
        body.stack = stack;
    }

    res.status(code).json(body);
};

export default errorHandler;
