import { Router } from 'express';

import authRouter from './auth';
import streamingRouter from './hls_stream';
import uploadRouter from './upload';

const router = Router();

// add routes here
router.use('/auth', authRouter);
router.use('/upload', uploadRouter);
router.use('/hls', streamingRouter);

export default router;
