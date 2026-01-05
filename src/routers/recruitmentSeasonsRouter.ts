import express from 'express';
import {
  getCurrentController,
  listController,
  openController,
  closeAllController,
  closeOneController,
  deleteController,
} from '../controllers/recruitmentSeasonsController';
import { authorizeRole } from '../middlewares/authMiddleware';
import { validateSeasonControl } from '../validators/validateRequest';

const router = express.Router();

// 用户端：获取当前可报名的通道
router.get('/current', getCurrentController);

// 管理端：获取所有列表
router.get('/list', authorizeRole('admin', 'superadmin'), listController);

// 开启新一季报名
router.post('/open', authorizeRole('admin', 'superadmin'), validateSeasonControl, openController);

// 关闭所有报名通道
router.post('/close-all', authorizeRole('admin', 'superadmin'), closeAllController);

// 关闭指定报名通道
router.post('/close', authorizeRole('admin', 'superadmin'), closeOneController);

// 删除报名通道（用于清理错误配置）
router.post('/delete', authorizeRole('admin', 'superadmin'), deleteController);

export default router;