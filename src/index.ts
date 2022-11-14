import * as dotenv from 'dotenv';
dotenv.config();

import express, { Express, Request, Response } from 'express';
import { setupDatabase } from './db/db_setup';
import { User } from './db/db_model';
// eslint-disable-next-line @typescript-eslint/no-floating-promises

// function catchPromise(target:Promise<any>,catchFunction:Function = (error:any) => {console.log("Promise failded!")}) {
//     return (target:Promise<any>) => {target.catch((error:any) => catchFunction(error))}
// }

const app: Express = express();
const port = process.env.PORT;

app.get('/', (req: Request, res: Response) => {
    // TODO fix this at some point:

    User.createNewUser('Jonas', 'Test').catch(() => console.log('Error on User creation'));

    res.send('<h1> Initial setup </h1>');
});

app.listen(port, () => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    setupDatabase().catch(() => console.log('Error on Database setup'));
    console.log(`[server]: Server is running at https://localhost:${port!}`);
});
