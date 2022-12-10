import { Router } from 'express';
import config from '../config';

import { requireAuth } from '../passport';
import authRouter from './auth';
import eventRouter from './event';
import infoRouter from './info';
import secretRouter from './secret';
import uploadRouter from './upload';

const router = Router();

// add routes here
router.use('/auth', authRouter);
if (config.ENABLE_SECRET_ROUTES) {
    router.use('/secret', secretRouter);
}
// all routes following this middleware require authorization
router.use(requireAuth);
router.use('/event', eventRouter);
router.use('/info', infoRouter);
router.use('/upload', uploadRouter);

export default router;
