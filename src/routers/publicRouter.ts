import express from 'express';
import { sendVerificationCodeController, verifyEmailCodeController } from '../controllers/emailController';
import { loginController, registerController, changePasswordController } from '../controllers/auth/authLoginController';
import { getAllDepartmentsController, getDepartmentByIdController } from '../controllers/departmentsController';
import { getAllTeamTermsController, getTeamTermByIdController } from '../controllers/teamTermsController';
import { getAllBackboneMembersController, getBackboneTreeController } from '../controllers/backboneMembersController';
import { getAllActivitiesController, getActivityByIdController } from '../controllers/activitiesController';
import { getAllHonorRecordsController, getHonorWallController } from '../controllers/honorRecordsController';
import { getPublishedAnnouncementsController } from '../controllers/announcementsController';
import { getPhotosByTermController, getPhotosByActivityController } from '../controllers/galleryPhotosController';
import { getMilestonesByTermController, getMilestonesByTypeController, getMilestonesByDateRangeController } from '../controllers/teamMilestonesController';

import {
  validateSendEmailCode,
  validateVerifyEmailCode,
  validateRegistration,
  validateLogin,
  validateChangePassword,
} from '../validators/validateRequest';

const router = express.Router();

/** 发送验证码 */
router.post('/email/send', validateSendEmailCode, sendVerificationCodeController);

/** 校验验证码 */
router.post('/email/verify', validateVerifyEmailCode, verifyEmailCodeController);

/** 注册 */
router.post('/auth/register', validateRegistration, registerController);

/** 登录 */
router.post('/auth/login', validateLogin, loginController);

/** 修改密码 */
router.post('/auth/change-password', validateChangePassword, changePasswordController);

/** 获取部门列表 */
router.get('/departments/list', getAllDepartmentsController);

/** 获取部门详情 */
router.get('/departments/:dept_id', getDepartmentByIdController);

/** 获取届次列表 */
router.get('/team-terms/list', getAllTeamTermsController);

/** 获取届次详情 */
router.get('/team-terms/:term_id', getTeamTermByIdController);

/** 获取骨干成员列表 */
router.get('/backbone-members/list', getAllBackboneMembersController);

/** 获取骨干成员树 */
router.get('/backbone-members/tree', getBackboneTreeController);

/** 获取活动列表 */
router.get('/activities/list', getAllActivitiesController);

/** 获取活动详情 */
router.get('/activities/:activity_id', getActivityByIdController);

/** 获取荣誉记录列表 */
router.get('/honor-records/list', getAllHonorRecordsController);

/** 获取荣誉墙 */
router.get('/honor-records/wall', getHonorWallController);

/** 获取已发布公告 */
router.get('/announcements/published', getPublishedAnnouncementsController);

/** 获取届次照片 */
router.get('/gallery-photos/term/:term_id', getPhotosByTermController);

/** 获取活动照片 */
router.get('/gallery-photos/activity/:activity_id', getPhotosByActivityController);

/** 获取届次历程 */
router.get('/team-milestones/term/:term_id', getMilestonesByTermController);

/** 按事件类型获取历程 */
router.get('/team-milestones/type/:event_type', getMilestonesByTypeController);

/** 按时间范围获取历程 */
router.get('/team-milestones/date-range', getMilestonesByDateRangeController);

export default router;