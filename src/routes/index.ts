import { Router } from 'express';

import authRouter from './auth';
import eventRouter from './event';
import streamingRouter from './hls_stream';
import infoRouter from './info';
import mediaRouter from './media';
import uploadRouter from './upload';

const router = Router();

// add routes here
router.use('/auth', authRouter);
router.use('/event', eventRouter);
router.use('/hls', streamingRouter);
router.use('/info', infoRouter);
router.use('/media', mediaRouter);
router.use('/upload', uploadRouter);

export default router;
