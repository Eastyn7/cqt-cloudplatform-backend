import express from 'express';
import {
  createActivityController,
  updateActivityController,
  deleteActivityController,
  changeActivityStatusController,
  getAllActivityNamesController,
  getAllActivitiesController,
  getAllActivitiesPageController
} from '../controllers/activitiesController';
import { authorizeRole } from '../middlewares/authMiddleware';
import { validateActivityCreate, validateActivityUpdate } from '../validators/validateRequest';

const router = express.Router();

// 创建志愿活动
router.post('/create', authorizeRole('admin', 'superadmin'), validateActivityCreate, createActivityController);

// 更新志愿活动
router.put('/update/:activity_id', authorizeRole('admin', 'superadmin'), validateActivityUpdate, updateActivityController);

// 删除志愿活动
router.delete('/delete/:activity_id', authorizeRole('admin', 'superadmin'), deleteActivityController);

// 切换活动状态
router.patch('/status/:activity_id', authorizeRole('admin', 'superadmin'), validateActivityUpdate, changeActivityStatusController);

// 获取活动分页列表（后台含草稿）
router.get('/page', authorizeRole('admin', 'superadmin'), getAllActivitiesPageController);

// 获取活动全量列表（后台含草稿）
router.get('/list', authorizeRole('admin', 'superadmin'), getAllActivitiesController);

// 获取全部活动名称列表（不分页）
router.get('/names', authorizeRole('admin', 'superadmin'), getAllActivityNamesController);

export default router;