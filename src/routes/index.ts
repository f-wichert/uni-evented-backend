import { Router } from 'express';

import authRouter from './auth';
import streamingRouter from './hls_stream';
import infoRouter from './info';
import mediaRouter from './media';
import uploadRouter from './upload';

const router = Router();

// add routes here
router.use('/auth', authRouter);
router.use('/upload', uploadRouter);
router.use('/hls', streamingRouter);
router.use('/info', infoRouter);
router.use('/media', mediaRouter);

export default router;
