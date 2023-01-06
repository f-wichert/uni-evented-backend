import { Router } from 'express';
import fs from 'fs/promises';
import path from 'path';

import config from '../config';
import { sequelize } from '../db';
import { generateTestdata } from '../scripts/resetDB';

const router = Router();

router.post('/reset-all', async (req, res) => {
    // remove media files
    for (const dir of [config.MEDIA_UPLOAD_ROOT, config.MEDIA_ROOT]) {
        for (const f of await fs.readdir(dir)) {
            await fs.rm(path.join(dir, f), { force: true, recursive: true });
        }
    }

    // remove all tables
    await sequelize.getQueryInterface().dropAllTables();

    // recreate test data
    await generateTestdata();

    // send response; then exit, letting process manager/docker restart the server
    res.json({ status: 'restarting' });
    process.exit(0);
});

export default router;
