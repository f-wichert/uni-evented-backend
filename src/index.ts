import express, { Express, NextFunction, Request, Response } from 'express';

import config from './config';
import { setupDatabase } from './db';
import { User } from './db/models/user';

/** Properly handles async errors in express routers */
function asyncHandler(fn: (req: Request, res: Response) => Promise<void>) {
    return function (req: Request, res: Response, next: NextFunction): void {
        fn(req, res).catch(next);
    };
}

const app: Express = express();

app.get(
    '/',
    asyncHandler(async (req: Request, res: Response) => {
        await User.create({ firstName: 'Jonas', lastName: 'Test' });

        res.send('<h1> Initial setup </h1>');
    })
);

async function init() {
    await setupDatabase();

    app.listen(config.PORT, () => {
        console.log(`Server is running at https://localhost:${config.PORT}`);
    });
}

void init();
