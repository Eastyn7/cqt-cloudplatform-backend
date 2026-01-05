import express from 'express';
import { cleanupVerificationCodesController, getAllVerificationCodesController } from '../controllers/emailController';
import { authorizeRole } from '../middlewares/authMiddleware';

const router = express.Router();

// 清理验证码记录
router.delete('/cleanup', authorizeRole('admin', 'superadmin'), cleanupVerificationCodesController);

// 获取验证码列表（分页/筛选）
router.get('/list', authorizeRole('admin', 'superadmin'), getAllVerificationCodesController);

export default router;