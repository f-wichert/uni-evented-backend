import { Router } from 'express';

import { requireAuth } from '../passport';
import authRouter from './auth';
import eventRouter from './event';
import streamingRouter from './hls_stream';
import infoRouter from './info';
import mediaRouter from './media';
import uploadRouter from './upload';

const router = Router();

// add routes here
router.use('/auth', authRouter);
router.use('/hls', streamingRouter); // TODO: require auth
router.use('/media', mediaRouter); // TODO: require auth
// all routes following this middleware require authorization
router.use(requireAuth);
router.use('/event', eventRouter);
router.use('/info', infoRouter);
router.use('/upload', uploadRouter);

export default router;
