import { Router } from 'express';
import { authorizeRole } from '../middlewares/authenticationMiddleware'
import {
  createBackboneMember,
  getBackboneMember,
  updateBackboneMember,
  deleteBackboneMember
} from '../controllers/backboneMembersController';

const router = Router();

// 创建骨干成员（此处建议只有管理员有权限操作）
router.post('/create', authorizeRole('1'),  createBackboneMember);

// 获取单个骨干成员
router.post('/get', getBackboneMember);

// 更新骨干成员（建议只有管理员有权限操作）
router.put('/update', authorizeRole('1'), updateBackboneMember);

// 删除骨干成员（建议只有管理员有权限操作）
router.delete('/delete', authorizeRole('1'),  deleteBackboneMember);

export default router;
