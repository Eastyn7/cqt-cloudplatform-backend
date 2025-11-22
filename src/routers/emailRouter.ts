import express from 'express';
import { cleanupVerificationCodesController } from '../controllers/emailController';
import { authorizeRole } from '../middlewares/authMiddleware';

const router = express.Router();

// 清理验证码记录
router.delete('/cleanup', authorizeRole('admin', 'superadmin'), cleanupVerificationCodesController);

export default router;