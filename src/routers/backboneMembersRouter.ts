import { Router } from 'express';
import {
  createBackboneMember,
  getBackboneMember,
  updateBackboneMember,
  deleteBackboneMember
} from '../controllers/backboneMembersController';

const router = Router();

// 创建背骨成员（此处建议只有管理员有权限操作）
router.post('/create',  createBackboneMember);

// 获取单个背骨成员
router.post('/get', getBackboneMember);

// 更新背骨成员（建议只有管理员有权限操作）
router.put('/update', updateBackboneMember);

// 删除背骨成员（建议只有管理员有权限操作）
router.delete('/delete',  deleteBackboneMember);

export default router;
