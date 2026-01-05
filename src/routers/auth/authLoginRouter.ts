import express from 'express';
import {
  batchRegisterController,
  deleteUserController,
  batchDeleteUsersController,
  getAllAdminsPageController,
  getAllAdminsController,
  setAdminController,
  removeAdminController,
  batchSetUserRolesController,
  searchUsersController
} from '../../controllers/auth/authLoginController';
import { authorizeRole } from '../../middlewares/authMiddleware';
import {
  validateBatchRegister,
  validateBatchDelete,
  validateSetAdmin,
  validateBatchSetUserRoles,
} from '../../validators/validateRequest';

const router = express.Router();

/** 批量注册 */
router.post('/batch-register', authorizeRole('admin', 'superadmin'), validateBatchRegister, batchRegisterController);

/** 删除单个用户 */
router.delete('/delete/:student_id', authorizeRole('superadmin'), deleteUserController);

/** 批量删除 */
router.post('/delete/batch', authorizeRole('superadmin'), validateBatchDelete, batchDeleteUsersController);

/** 获取所有管理员（分页） */
router.get('/admin/list-page', authorizeRole('admin', 'superadmin'), getAllAdminsPageController);

/** 获取所有管理员（全量） */
router.get('/admin/list', authorizeRole('admin', 'superadmin'), getAllAdminsController);

/** 设置单个管理员 */
router.post('/admin/set-single', authorizeRole('superadmin'), validateSetAdmin, setAdminController);

/** 批量设置用户角色（可设置为 admin 或 superadmin） */
router.post('/admin/set', authorizeRole('superadmin'), validateBatchSetUserRoles, batchSetUserRolesController);

/** 取消管理员身份 */
router.post('/admin/remove', authorizeRole('superadmin'), validateSetAdmin, removeAdminController);

/** 搜索用户 */
router.get('/users/search', authorizeRole('admin', 'superadmin'), searchUsersController);

export default router;