import { Router } from 'express';

import authRouter from './auth';

const router = Router();

// add routes here
router.use('/auth', authRouter);

export default router;
