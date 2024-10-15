import { Router } from 'express';
import authRoutes from './authRouter';

const router = Router();

router.use('/auths', authRoutes); // 用户相关的API

export default router;
