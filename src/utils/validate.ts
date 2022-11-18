/* eslint-disable @typescript-eslint/no-explicit-any */

import { RequestHandler } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { z, ZodObject, ZodRawShape } from 'zod';

import config from '../config';

/* Usage:
 *     router.post(
 *         '/path',
 *         validateBody(z.object({...})),
 *         (req, res) => {
 *             ...
 *         }
 *     )
 *
 * Note that the `req` parameter has no type annotation,
 * this way `req.body` gets inferred automatically based on the specified object schema.
 */

// heavily inspired by https://github.com/Aquila169/zod-express-middleware

export function validateBody<TSchema extends ZodRawShape>(
    schema: ZodObject<TSchema, any>,
    strict = true
): RequestHandler<ParamsDictionary, any, z.infer<ZodObject<TSchema>>, any> {
    return (req, res, next) => {
        if (strict) {
            schema = schema.strict();
        }
        const parsed = schema.safeParse(req.body);
        if (parsed.success) {
            req.body = parsed.data;
            return next();
        } else {
            const resData =
                config.NODE_ENV === 'development' ? parsed.error.format() : 'invalid payload';
            return res.status(400).send({ error: resData });
        }
    };
}
