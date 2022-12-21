/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { RequestHandler } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { z, ZodObject, ZodRawShape } from 'zod';

import config from '../config';

/** Usage:
 *  ```javascript
 *  router.post(
 *      '/path',
 *      validateBody(z.object({...})),
 *      (req, res) => {
 *          ...
 *      }
 *  )
 * ```
 *
 * Note that the `req` parameter has no type annotation,
 * this way `req.body` gets inferred automatically based on the specified object schema.
 */

// heavily inspired by https://github.com/Aquila169/zod-express-middleware

// use strict by default if running in dev mode
const STRICT_DEFAULT = config.NODE_ENV !== 'production';

function internalValidate(
    schema: ZodObject<any, any>,
    field: 'params' | 'body' | 'query',
): RequestHandler<any, any, any, any> {
    return (req, res, next) => {
        const parsed = schema.safeParse(req[field]);
        if (parsed.success) {
            req[field] = parsed.data;
            next();
        } else {
            const error =
                config.NODE_ENV === 'development'
                    ? parsed.error.format()
                    : `invalid request ${field}`;
            res.status(400).send({ error });
            next(`Invalid request ${field}: ${JSON.stringify(error)}`);
        }
    };
}

export function validateParams<TSchema extends ZodRawShape>(
    schema: ZodObject<TSchema, any>,
    strict = STRICT_DEFAULT,
): RequestHandler<z.infer<ZodObject<TSchema>>, any, any, any> {
    if (strict) schema = schema.strict();
    return internalValidate(schema, 'params');
}

export function validateBody<TSchema extends ZodRawShape>(
    schema: ZodObject<TSchema, any>,
    strict = STRICT_DEFAULT,
): RequestHandler<ParamsDictionary, any, z.infer<ZodObject<TSchema>>, any> {
    if (strict) schema = schema.strict();
    return internalValidate(schema, 'body');
}

export function validateQuery<TSchema extends ZodRawShape>(
    schema: ZodObject<TSchema, any>,
    strict = STRICT_DEFAULT,
): RequestHandler<ParamsDictionary, any, any, z.infer<ZodObject<TSchema>>> {
    if (strict) schema = schema.strict();
    return internalValidate(schema, 'query');
}

export const dateSchema = z.preprocess((arg: unknown) => {
    if (typeof arg === 'string' || arg instanceof Date) return new Date(arg);
}, z.date());
