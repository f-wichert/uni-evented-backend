import express, { Express, Request, Response } from 'express';
import {testConnection} from './db/db_connection';

const dotenv = require('dotenv');

dotenv.config();

const app: Express = express();
const port = process.env.PORT;

app.get('/', (req: Request, res: Response) => {
  res.send('<h1> Initial setup </h1>');
  testConnection();
});

app.listen(port, () => {
  console.log(`[server]: Server is running at https://localhost:${port}`);
});