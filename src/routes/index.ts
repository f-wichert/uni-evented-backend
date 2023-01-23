import assert from 'assert';
import { Router } from 'express';
import config from '../config';

import { requireAuth } from '../passport';
import adminRouter from './admin';
import authRouter from './auth';
import discoverRouter from './discover';
import eventRouter from './event';
import infoRouter from './info';
import secretRouter from './secret';
import uploadRouter from './upload';
import userRouter from './user';

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
router.use('/discover', discoverRouter);
router.use('/user', userRouter);

// require admin
router.use((req, res, next) => {
    assert(!req.user!.isAdmin);
    next();
});
router.use('/admin', adminRouter);

export default router;
