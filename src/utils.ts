import { NextFunction, Request, Response } from 'express';

/** Properly handles async errors in express routers */
export function asyncHandler(fn: (req: Request, res: Response) => Promise<void>) {
    return function (req: Request, res: Response, next: NextFunction): void {
        fn(req, res).catch(next);
    };
}
