import express from 'express';
import {
  updateUserInfoController,
  getUserInfoController,
  getAllUsersInfoController,
  batchImportUsersInfoController
} from '../../controllers/auth/authInfoController';

import { authorizeRole } from '../../middlewares/authMiddleware';
import {
  validateAuthInfoUpdate,
  validateBatchAuthInfoCreate,
} from '../../validators/validateRequest';

const router = express.Router();

/** 更新单个用户信息 */
router.put('/update/:student_id', validateAuthInfoUpdate, updateUserInfoController);

/** 查询单个用户信息 */
router.get('/info/:student_id', getUserInfoController);

/** 查询所有用户信息 */
router.get('/all', authorizeRole('admin', 'superadmin'), getAllUsersInfoController);

/** 批量导入 / 更新用户信息 */
router.post('/batch-import', authorizeRole('admin', 'superadmin'), validateBatchAuthInfoCreate, batchImportUsersInfoController);

export default router;