import express, { Router } from 'express';
import config from '../config';
import { requireAuth } from '../passport';

const router = Router();

router.use(
    '/',
    requireAuth,
    (req, res, next) => {
        // TODO
        return next();
    },
    express.static(config.MEDIA_ROOT)
);

export default router;
