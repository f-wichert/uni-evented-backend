import express, { Express, Request, Response } from 'express';
import { setupDatabase } from './db/db_setup';
import {User} from './db/db_model';

const dotenv = require('dotenv');

dotenv.config();

const app: Express = express();
const port = process.env.PORT;

app.get('/', (req: Request, res: Response) => {
    User.createNewUser('Jonas','Test');
    res.send('<h1> Initial setup </h1>');
});

app.listen(port, () => {
    setupDatabase();
    console.log(`[server]: Server is running at https://localhost:${port}`);
});