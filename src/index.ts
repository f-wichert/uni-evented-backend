import compression from 'compression';
import express from 'express';
import morgan from 'morgan';
import passport from 'passport';

import config from './config';
import { setupDatabase } from './db';
import { User } from './db/models/user';
import routes from './routes';
import { asyncHandler } from './utils';

const app = express();

app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(morgan(config.NODE_ENV === 'development' ? 'dev' : 'common'));

app.use(passport.initialize());

// mount routers
app.use('/api', routes);

app.get(
    '/',
    asyncHandler(async (req, res) => {
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
