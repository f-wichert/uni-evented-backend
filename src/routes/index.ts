import { Router } from 'express';

import { requireAuth } from '../passport';
import authRouter from './auth';
import eventRouter from './event';
import infoRouter from './info';
import mediaRouter from './media';
import uploadRouter from './upload';

const router = Router();

// add routes here
router.use('/auth', authRouter);
router.use('/media', mediaRouter);
// all routes following this middleware require authorization
router.use(requireAuth);
router.use('/event', eventRouter);
router.use('/info', infoRouter);
router.use('/upload', uploadRouter);

export default router;
