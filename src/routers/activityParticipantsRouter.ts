import express from 'express';
import {
  getParticipantsByActivityController,
  joinActivityController,
  cancelActivityController,
  markSignInController,
  updateServiceHoursController,
  batchUpdateServiceHoursController,
  getRecordsByStudentController,
  getAllParticipantsController
} from '../controllers/activityParticipantsController';
import { authorizeRole } from '../middlewares/authMiddleware';
import { validateActivityParticipantCreate, validateActivityParticipantUpdate, validateBatchActivityParticipantUpdate } from '../validators/validateRequest';

const router = express.Router();

// 获取活动报名名单
router.get('/list/:activity_id', authorizeRole('admin', 'superadmin'), getParticipantsByActivityController);

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

// 查询学生个人报名记录
router.get('/records/:student_id', getRecordsByStudentController);

// 查询所有活动参与记录
router.get('/all', authorizeRole('admin', 'superadmin'), getAllParticipantsController);

export default router;