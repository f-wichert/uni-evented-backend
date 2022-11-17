import express, { Express, Request, Response } from 'express';

import passport from 'passport';
import config from './config';
import { setupDatabase } from './db';
import { User } from './db/models/user';
import routes from './routes';
import { asyncHandler } from './utils';

const app: Express = express();

// TODO: csrf and other middlewares
app.use(express.json());
app.use(passport.initialize());

// mount routers
app.use('/api', routes);

app.get(
    '/',
    asyncHandler(async (req: Request, res: Response) => {
        console.log(await User.findAll());

        res.json({ things: 'stuff' });
    })
);

async function init() {
    await setupDatabase();

    app.listen(config.PORT, () => {
        console.log(`Server is running at http://localhost:${config.PORT}`);
    });
}

void init();
