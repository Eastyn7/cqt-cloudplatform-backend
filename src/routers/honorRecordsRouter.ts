import express from 'express';
import {
  createHonorRecordController,
  updateHonorRecordController,
  deleteHonorRecordController,
  batchCreateHonorRecordsController
} from '../controllers/honorRecordsController';
import { authorizeRole } from '../middlewares/authMiddleware';
import { validateHonorCreate, validateHonorUpdate, validateBatchHonorCreate } from '../validators/validateRequest';

const router = express.Router();

// 创建荣誉记录
router.post('/create', authorizeRole('admin', 'superadmin'), validateHonorCreate, createHonorRecordController);

// 更新荣誉记录
router.put('/update/:honor_id', authorizeRole('admin', 'superadmin'), validateHonorUpdate, updateHonorRecordController);

// 删除荣誉记录
router.delete('/delete/:honor_id', authorizeRole('admin', 'superadmin'), deleteHonorRecordController);

// 批量创建荣誉记录
router.post('/batch-create', authorizeRole('admin', 'superadmin'), validateBatchHonorCreate, batchCreateHonorRecordsController);

export default router;