import express from 'express';
import {
  createDepartmentController,
  updateDepartmentController,
  deleteDepartmentController,
  batchCreateDepartmentsController
} from '../controllers/departmentsController';
import { authorizeRole } from '../middlewares/authMiddleware';
import { validateDepartmentCreate, validateDepartmentUpdate, validateBatchDepartmentCreate } from '../validators/validateRequest';

const router = express.Router();

// 创建部门
router.post('/create', authorizeRole('superadmin'), validateDepartmentCreate, createDepartmentController);

// 更新部门信息
router.put('/update/:dept_id', authorizeRole('admin', 'superadmin'), validateDepartmentUpdate, updateDepartmentController);

// 删除部门
router.delete('/delete/:dept_id', authorizeRole('superadmin'), deleteDepartmentController);

// 批量创建部门
router.post('/batch-create', authorizeRole('superadmin'), validateBatchDepartmentCreate, batchCreateDepartmentsController);

export default router;