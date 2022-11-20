import { NextFunction, Request, Response } from 'express';

/** Properly handles async errors in express routers */
export function asyncHandler<RequestT extends Request, ResponseT extends Response>(
    fn: (req: RequestT, res: ResponseT) => Promise<void>
) {
    return function (req: RequestT, res: ResponseT, next: NextFunction): void {
        fn(req, res).catch(next);
    };
}
