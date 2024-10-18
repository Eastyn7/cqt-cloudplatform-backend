import { Router } from 'express';
import { getAuthInfo } from '../controllers/authController';

const router = Router();

// 获取用户信息
router.post('/getauthinfo', getAuthInfo);

export default router;
