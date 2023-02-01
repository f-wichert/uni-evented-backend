import * as dotenv from 'dotenv';
dotenv.config();

import { app } from './app';
import config from './config';
import { connect } from './db';
import nodeMediaServer from './live';

async function init() {
    await connect();

    nodeMediaServer.run();

    app.listen(config.PORT, () => {
        console.log(`Server is running at http://localhost:${config.PORT}`);
    });
}

void init();
