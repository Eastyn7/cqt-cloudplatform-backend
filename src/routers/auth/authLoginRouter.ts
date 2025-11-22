import express from 'express';
import {
  batchRegisterController,
  deleteUserController,
  batchDeleteUsersController,
  changePasswordController
} from '../../controllers/auth/authLoginController';
import { authorizeRole } from '../../middlewares/authMiddleware';
import {
  validateBatchRegister,
  validateBatchDelete,
} from '../../validators/validateRequest';

const router = express.Router();

/** 批量注册 */
router.post('/batch-register', authorizeRole('admin', 'superadmin'), validateBatchRegister, batchRegisterController);

/** 删除单个用户 */
router.delete('/delete/:student_id', authorizeRole('superadmin'), deleteUserController);

/** 批量删除 */
router.post('/delete/batch', authorizeRole('superadmin'), validateBatchDelete, batchDeleteUsersController);

export default router;