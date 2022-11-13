import * as dotenv from "dotenv";
dotenv.config();

import express, { Express, Request, Response } from 'express';
import { setupDatabase } from './db/db_setup';
import {User} from './db/db_model';

const app: Express = express();
const port = process.env.PORT;

app.get('/', (req: Request, res: Response) => {
    // TODO fix this at some point:
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    User.createNewUser('Jonas','Test');
    res.send('<h1> Initial setup </h1>');
});

app.listen(port, () => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    setupDatabase();
    console.log(`[server]: Server is running at https://localhost:${port!}`);
});
