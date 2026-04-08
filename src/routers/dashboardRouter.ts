import express from 'express';
import { getDashboardDataController } from '../controllers/dashboardController';
import { authorizeRole } from '../middlewares/authMiddleware';

const router = express.Router();

/**
 * 获取驾驶舱数据
 * @route GET /api/dashboard/data
 * @query timeRange - 时间范围: '30d' | '90d' | '1y' | 'all'
 * @access user, admin, superadmin
 */
router.get('/data', authorizeRole('user', 'admin', 'superadmin'), getDashboardDataController);

export default router;
