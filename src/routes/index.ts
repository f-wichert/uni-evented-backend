import { Router } from 'express';

import authRouter from './auth';
import uploadRouter from './upload';
import streamingRouter from './hls_stream';

const router = Router();

// add routes here
router.use('/auth', authRouter);
router.use('/upload', uploadRouter);
router.use('/hls', streamingRouter);


export default router;
