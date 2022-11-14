import * as dotenv from 'dotenv';
dotenv.config();

import express, { Express, NextFunction, Request, Response } from 'express';
import { setupDatabase } from './db/db_setup';
import { User } from './db/db_model';

/** Properly handles async errors in express routers */
function asyncHandler(fn: (req: Request, res: Response) => Promise<void>) {
    return function (req: Request, res: Response, next: NextFunction): void {
        fn(req, res).catch(next);
    };
}

const app: Express = express();
const port = process.env.PORT;

app.get(
    '/',
    asyncHandler(async (req: Request, res: Response) => {
        await User.createNewUser('Jonas', 'Test');

        res.send('<h1> Initial setup </h1>');
    })
);

async function init() {
    await setupDatabase();

    app.listen(port, () => {
        console.log(`Server is running at https://localhost:${port!}`);
    });
}

void init();
