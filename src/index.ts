import * as dotenv from 'dotenv';
dotenv.config();

import express, { Express, Request, Response } from 'express';
import { setupDatabase } from './db/db_setup';
import { User } from './db/db_model';
// eslint-disable-next-line @typescript-eslint/no-floating-promises

// Attempt at Decorator. But TS doesnt like me
// function catchPromise(target:Promise<any>,catchFunction:Function = (error:any) => {console.log("Promise failded!")}) {
//     return (target:Promise<any>) => {target.catch((error:any) => catchFunction(error))}
// }

const app: Express = express();
const port = process.env.PORT;

app.get('/', (req: Request, res: Response) => {
    User.createNewUser('Jonas', 'Test')
        .then(() => res.send('<h1> Initial setup </h1>'))
        .catch(() => console.log('Error on User creation'));
});

app.listen(port, () => {
    setupDatabase()
        .then(() => console.log(`[server]: Server is running at https://localhost:${port!}`))
        .catch(() => console.log('Error on Database setup'));
});
