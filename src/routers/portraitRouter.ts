import express from 'express';
import { getPortraitController } from '../controllers/portraitController';
import { authorizeRole } from '../middlewares/authMiddleware';

const router = express.Router();

/**
 * 获取个人画像
 * @route GET /api/user/portrait
 * @query student_id - 可选，管理员可查询指定用户
 * @access user, admin, superadmin
 */
router.get('/portrait', authorizeRole('user', 'admin', 'superadmin'), getPortraitController);

export default router;
