import express from 'express';
import { getDashboardDataController } from '../controllers/dashboardController';
import { authorizeRole } from '../middlewares/authMiddleware';

const router = express.Router();

/**
 * 获取驾驶舱数据
 * @route GET /api/dashboard/data
 * @query timeRange - 时间范围: '30d' | '90d' | '1y' | 'all'
 * @access admin, superadmin
 */
router.get('/data', authorizeRole('admin', 'superadmin'), getDashboardDataController);

export default router;
