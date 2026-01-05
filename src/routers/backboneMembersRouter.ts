import express from 'express';
import {
  createBackboneMemberController,
  updateBackboneMemberController,
  deleteBackboneMemberController,
  batchCreateBackboneMembersController
} from '../controllers/backboneMembersController';
import { authorizeRole } from '../middlewares/authMiddleware';
import { validateBackboneMemberCreate, validateBackboneMemberUpdate, validateBatchBackboneMemberCreate } from '../validators/validateRequest'

const router = express.Router();

// 创建骨干成员
router.post('/create', authorizeRole('admin', 'superadmin'), validateBackboneMemberCreate, createBackboneMemberController);

// 更新骨干成员信息
router.put('/update/:member_id', authorizeRole('admin', 'superadmin'), validateBackboneMemberUpdate, updateBackboneMemberController);

// 删除骨干成员
router.delete('/delete/:member_id', authorizeRole('admin', 'superadmin'), deleteBackboneMemberController);

// 批量创建骨干成员
router.post('/batch-create', authorizeRole('admin', 'superadmin'), validateBatchBackboneMemberCreate, batchCreateBackboneMembersController);

export default router;