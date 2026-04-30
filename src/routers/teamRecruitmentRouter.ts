import express from 'express';
import {
  submitApplyController,
  getAdminPageController,
  reviewStageController,
  assignFinalController,
  getDepartmentApplicantsController,
  getUserStatusController,
  getMyApplicationController,
} from '../controllers/teamRecruitmentController';
import { authorizeRole } from '../middlewares/authMiddleware';
import { validateRecruitmentApply, validateReviewStage, validateAssignDept } from '../validators/validateRequest';

const router = express.Router();

// 获取当前用户的身份信息（用于表单提交前的资格判断）
router.get('/user-status', getUserStatusController);

// 查询当前用户某年度某类型的报名详情（用于表单回显）
router.get('/me', getMyApplicationController);

// 学生提交报名
router.post('/create', validateRecruitmentApply, submitApplyController);

// 分页查询报名列表（超级管理员专用）
router.get('/page', authorizeRole('admin', 'superadmin'), getAdminPageController);

// 部门管理员查看本部门所有报名
router.get('/department-applicants/page', authorizeRole('admin'), getDepartmentApplicantsController);

// 审核面试结果（批量）
router.post('/review', authorizeRole('admin', 'superadmin'), validateReviewStage, reviewStageController);

// 最终任命/分配
router.post('/assign', authorizeRole('admin', 'superadmin'), validateAssignDept, assignFinalController);

export default router;