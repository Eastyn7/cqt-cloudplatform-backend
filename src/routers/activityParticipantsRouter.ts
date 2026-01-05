import express from 'express';
import {
  getParticipantsByActivityController,
  getAllParticipantsByActivityController,
  joinActivityController,
  cancelActivityController,
  markSignInController,
  updateServiceHoursController,
  batchUpdateServiceHoursController,
  getRecordsByStudentPageController,
  getRecordsByStudentController,
  getAllParticipantsPageController,
  getAllParticipantsController
} from '../controllers/activityParticipantsController';
import { authorizeRole } from '../middlewares/authMiddleware';
import { validateActivityParticipantCreate, validateActivityParticipantUpdate, validateBatchActivityParticipantUpdate } from '../validators/validateRequest';

const router = express.Router();

// 获取活动报名名单
router.get('/page/:activity_id', authorizeRole('admin', 'superadmin'), getParticipantsByActivityController);

// 获取活动报名名单（全量）
router.get('/list/:activity_id', authorizeRole('admin', 'superadmin'), getAllParticipantsByActivityController);

// 学生报名活动
router.post('/join', validateActivityParticipantCreate, joinActivityController);

// 取消活动报名
router.delete('/cancel/:activity_id/:student_id', cancelActivityController);

// 活动签到/取消签到
router.patch('/signin/:record_id', authorizeRole('admin', 'superadmin'), validateActivityParticipantUpdate, markSignInController);

// 单个更新服务时长
router.patch('/hours/:record_id', authorizeRole('admin', 'superadmin'), validateActivityParticipantUpdate, updateServiceHoursController);

// 批量更新服务时长
router.put('/hours/batch', authorizeRole('admin', 'superadmin'), validateBatchActivityParticipantUpdate, batchUpdateServiceHoursController);

// 查询学生个人报名记录（分页）
router.get('/records/page/:student_id', getRecordsByStudentPageController);

// 查询学生个人报名记录（全量）
router.get('/records/list/:student_id', getRecordsByStudentController);

// 查询所有活动参与记录（分页）
router.get('/all/page', authorizeRole('admin', 'superadmin'), getAllParticipantsPageController);

// 查询所有活动参与记录（全量）
router.get('/all/list', authorizeRole('admin', 'superadmin'), getAllParticipantsController);

export default router;