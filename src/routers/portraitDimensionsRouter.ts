import express from 'express';
import {
  createPortraitDimensionController,
  getPortraitDimensionsPageController,
  getAllPortraitDimensionsController,
  getPortraitDimensionByIdController,
  updatePortraitDimensionController,
  deletePortraitDimensionController
} from '../controllers/portraitDimensionsController';
import { authorizeRole } from '../middlewares/authMiddleware';
import {
  validatePortraitDimensionCreate,
  validatePortraitDimensionUpdate
} from '../validators/validateRequest';

const router = express.Router();

// 创建画像维度
router.post('/create', authorizeRole('admin', 'superadmin'), validatePortraitDimensionCreate, createPortraitDimensionController);

// 分页查询画像维度
router.get('/page', authorizeRole('admin', 'superadmin'), getPortraitDimensionsPageController);

// 获取画像维度全量
router.get('/list', authorizeRole('admin', 'superadmin'), getAllPortraitDimensionsController);

// 获取单个画像维度
router.get('/:dimension_id', authorizeRole('admin', 'superadmin'), getPortraitDimensionByIdController);

// 更新画像维度
router.put('/update/:dimension_id', authorizeRole('admin', 'superadmin'), validatePortraitDimensionUpdate, updatePortraitDimensionController);

// 删除画像维度
router.delete('/delete/:dimension_id', authorizeRole('admin', 'superadmin'), deletePortraitDimensionController);

export default router;
