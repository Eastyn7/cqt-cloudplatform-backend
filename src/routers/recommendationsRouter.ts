import express from 'express';
import {
  getMyRecommendationsController,
  refreshRecommendationsController,
  getRecommendationsPageController,
  getRecommendationStrategyController,
  updateRecommendationStrategyController
} from '../controllers/recommendationsController';
import { authorizeRole } from '../middlewares/authMiddleware';
import { validateRecommendationStrategyUpdate, validateRecommendationsRefresh } from '../validators/validateRequest';

const router = express.Router();

// 获取我的推荐列表
router.get('/me', authorizeRole('user', 'admin', 'superadmin'), getMyRecommendationsController);

// 管理员刷新指定用户推荐
router.post('/refresh', authorizeRole('admin', 'superadmin'), validateRecommendationsRefresh, refreshRecommendationsController);

// 推荐记录分页（管理端）
router.get('/page', authorizeRole('admin', 'superadmin'), getRecommendationsPageController);

// 推荐策略查询（管理端）
router.get('/strategy', authorizeRole('admin', 'superadmin'), getRecommendationStrategyController);

// 推荐策略更新（管理端）
router.put('/strategy', authorizeRole('admin', 'superadmin'), validateRecommendationStrategyUpdate, updateRecommendationStrategyController);

export default router;
