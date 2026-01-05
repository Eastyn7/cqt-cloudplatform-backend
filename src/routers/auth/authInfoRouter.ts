import express from 'express';
import {
  updateUserInfoController,
  getUserInfoController,
  getAllUsersInfoController,
  getUsersInfoPageController,
  batchImportUsersInfoController,
  getCollegesAndMajorsController,
  getAllAdminsInfoController
} from '../../controllers/auth/authInfoController';
import { authorizeRole } from '../../middlewares/authMiddleware';
import {
  validateAuthInfoUpdate,
  validateBatchAuthInfoCreate,
} from '../../validators/validateRequest';

const router = express.Router();

/** 更新单个用户信息 */
router.put(
  '/update/:student_id',
  validateAuthInfoUpdate,
  updateUserInfoController
);

/** 查询单个用户信息 */
router.get(
  '/info/:student_id',
  getUserInfoController
);

/** 分页查询用户信息 */
router.get(
  '/page',
  authorizeRole('admin', 'superadmin'),
  getUsersInfoPageController
);

/** 查询所有用户信息（一次性） */
router.get(
  '/all',
  authorizeRole('admin', 'superadmin'),
  getAllUsersInfoController
);

/** 批量导入 / 更新用户信息 */
router.post(
  '/batch-import',
  authorizeRole('admin', 'superadmin'),
  validateBatchAuthInfoCreate,
  batchImportUsersInfoController
);

/** 获取所有用户学院和专业 */
router.get(
  '/colleges-majors',
  authorizeRole('admin', 'superadmin'),
  getCollegesAndMajorsController
);

/** 获取所有管理员信息 */
router.get(
  '/admins',
  authorizeRole('admin', 'superadmin'),
  getAllAdminsInfoController
);

export default router;