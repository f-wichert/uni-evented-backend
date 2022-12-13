/* eslint-disable @typescript-eslint/no-explicit-any */

// Adds `Promise<void>` to handler return type, fixing eslint errors when using `express-async-errors` for async routes.
// Taken from https://github.com/DefinitelyTyped/DefinitelyTyped/blob/a6d2e7c500b9c4760eebebf7ce272ffef1f35ba3/types/express-serve-static-core/index.d.ts
// (https://github.com/davidbanham/express-async-errors/issues/35)
declare global {
    declare module 'express-serve-static-core' {
        interface RequestHandler<
            P = ParamsDictionary,
            ResBody = any,
            ReqBody = any,
            ReqQuery = ParsedQs,
            Locals extends Record<string, any> = Record<string, any>,
        > {
            (
                req: Request<P, ResBody, ReqBody, ReqQuery, Locals>,
                res: Response<ResBody, Locals>,
                next: NextFunction,
            ): void | Promise<void>;
        }
    }
}

// Merge custom user type into express request type declaration
// (this globally changes the type of `req.user` to our `User` db model)
// see https://github.com/DefinitelyTyped/DefinitelyTyped/commit/91c229dbdb653dbf0da91992f525905893cbeb91#r34812715
declare namespace Express {
    type User = import('./db/models/user').default;
}

// This doesn't have/need typings, just declare it to silence warnings.
declare module 'express-async-errors';
