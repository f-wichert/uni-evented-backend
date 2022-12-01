import compression from 'compression';
import express from 'express';

import fileUpload from 'express-fileupload';
import fs from 'fs';
import morgan from 'morgan';
import passport from 'passport';

import config from './config';
import { connect } from './db';
import User from './db/models/user';
import routes from './routes';
import { asyncHandler } from './utils';

const app = express();

app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(morgan(config.NODE_ENV === 'development' ? 'dev' : 'common'));

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
        await User.findAll();
        res.json({ things: 'stuff' });
    })
);

app.get('/email', (req, res) => {
    console.log('Sending Email');
    // sendSimpleMail('laurenz.kammeyer@gmx.de', 'TestMail', '<h1> Hallo von Bot 4 </h1>')
    console.log('Send Mail');
    res.send('<h1> Top </h1>');
});

async function init() {
    await connect();

    // create media directories if they don't exists
    await fs.promises.mkdir(config.MEDIA_ROOT + '/clips', { recursive: true });
    await fs.promises.mkdir(config.MEDIA_UPLOAD_ROOT, { recursive: true });

    app.listen(config.PORT, () => {
        console.log(`Server is running at http://localhost:${config.PORT}`);
    });
    console.log('finished Setup');
}

void init();
