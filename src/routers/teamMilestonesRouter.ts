import express from 'express';
import {
  createMilestoneController,
  updateMilestoneController,
  deleteMilestoneController,
  getAllMilestonesPageController,
  getAllMilestonesController
} from '../controllers/teamMilestonesController';
import { authorizeRole } from '../middlewares/authMiddleware';
import { validateTeamMilestoneCreate, validateTeamMilestoneUpdate } from '../validators/validateRequest';

const router = express.Router();

// 创建里程碑
router.post('/create', authorizeRole('admin', 'superadmin'), validateTeamMilestoneCreate, createMilestoneController);

// 更新里程碑
router.put('/update/:milestone_id', authorizeRole('admin', 'superadmin'), validateTeamMilestoneUpdate, updateMilestoneController);

// 删除里程碑
router.delete('/delete/:milestone_id', authorizeRole('admin', 'superadmin'), deleteMilestoneController);

// 后台里程碑列表（分页）
router.get('/page', authorizeRole('admin', 'superadmin'), getAllMilestonesPageController);

// 后台里程碑列表（全量）
router.get('/list', authorizeRole('admin', 'superadmin'), getAllMilestonesController);

export default router;