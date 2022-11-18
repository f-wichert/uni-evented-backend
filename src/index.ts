import express from 'express';

import fileUpload from 'express-fileupload';
import fs from 'fs';
import passport from 'passport';
import config from './config';
import { connect } from './db';
import { User } from './db/models/user';
import routes from './routes';
import { asyncHandler } from './utils';

const app = express();

// TODO: csrf and other middlewares
app.use(express.json());
app.use(passport.initialize());
app.use(
    fileUpload({
        limits: { fileSize: 50 * 1024 * 1024 },
    })
);

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
    await connect();

    // create media directories if they don't exists
    await fs.promises.mkdir(config.MEDIA_ROOT + '/clips', { recursive: true });
    await fs.promises.mkdir(config.MEDIA_UPLOAD_ROOT, { recursive: true });

    app.listen(config.PORT, () => {
        console.log(`Server is running at http://localhost:${config.PORT}`);
    });
}

void init();
