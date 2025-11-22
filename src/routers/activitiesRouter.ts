import express from 'express';
import {
  createActivityController,
  updateActivityController,
  deleteActivityController,
  changeActivityStatusController
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

export default router;