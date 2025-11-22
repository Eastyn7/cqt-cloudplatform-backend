import express from 'express';
import {
  createTeamTermController,
  updateTeamTermController,
  deleteTeamTermController,
  batchCreateTeamTermsController
} from '../controllers/teamTermsController';
import { authorizeRole } from '../middlewares/authMiddleware';
import { validateTeamTermCreate, validateTeamTermUpdate, validateBatchTeamTermCreate } from '../validators/validateRequest';

const router = express.Router();

// 创建届次
router.post('/create', authorizeRole('superadmin'), validateTeamTermCreate, createTeamTermController);

// 更新届次信息
router.put('/update/:term_id', authorizeRole('superadmin'), validateTeamTermUpdate, updateTeamTermController);

// 删除届次
router.delete('/delete/:term_id', authorizeRole('superadmin'), deleteTeamTermController);

// 批量创建届次
router.post('/batch-create', authorizeRole('superadmin'), validateBatchTeamTermCreate, batchCreateTeamTermsController);

export default router;