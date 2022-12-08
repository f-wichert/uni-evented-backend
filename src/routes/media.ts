import express, { Router } from 'express';
import config from '../config';

const router = Router();

router.use('/', express.static(config.MEDIA_ROOT));

export default router;
