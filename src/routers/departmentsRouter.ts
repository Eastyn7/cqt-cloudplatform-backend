import { Router } from 'express';
import { createDepartment, getDepartments, getDepartment, updateDepartment, deleteDepartment } from '../controllers/departmentsController';

const router = Router();

// 创建部门
router.post('/createdepartment', createDepartment);

// 获取所有部门
router.post('/getdepartments', getDepartments);

// 获取单个部门
router.post('/getdepartment', getDepartment);

// 更新部门
router.put('/updatedepartment', updateDepartment);

// 删除部门
router.delete('/deletedepartment', deleteDepartment);

export default router;