import express from 'express';
import {
  submitApplyController,
  getAdminPageController,
  reviewStageController,
  assignFinalController,
  getDepartmentApplicantsController,
} from '../controllers/teamRecruitmentController';
import { authorizeRole } from '../middlewares/authMiddleware';
import { validateRecruitmentApply, validateReviewStage, validateAssignDept } from '../validators/validateRequest';

const router = express.Router();

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