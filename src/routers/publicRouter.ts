import express from 'express';
import { sendVerificationCodeController, verifyEmailCodeController } from '../controllers/emailController';
import { loginController, registerController, changePasswordController } from '../controllers/auth/authLoginController';
import { getAllDepartmentsController, getDepartmentsPageController, getDepartmentByIdController } from '../controllers/departmentsController';
import { getAllTeamTermsPageController, getAllTeamTermsController, getTeamTermByIdController } from '../controllers/teamTermsController';
import { getAllBackboneMembersController, getAllBackboneMembersPageController, getBackboneTreeController } from '../controllers/backboneMembersController';
import { getAllActivitiesController, getAllActivitiesPageController, getActivityByIdController } from '../controllers/activitiesController';
import { getAllHonorRecordsController, getHonorRecordsPageController, getHonorWallController, getHonorWallPageController } from '../controllers/honorRecordsController';
import { getPublishedAnnouncementsController } from '../controllers/announcementsController';
import { getPhotosByTermController, getPhotosByActivityController } from '../controllers/galleryPhotosController';
import { getMilestonesByTermPageController, getMilestonesByTermController, getMilestonesByTypePageController, getMilestonesByTypeController, getMilestonesByDateRangePageController, getMilestonesByDateRangeController } from '../controllers/teamMilestonesController';

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

/** 获取部门全量列表 */
router.get('/departments/list', getAllDepartmentsController);

/** 获取部门分页列表 */
router.get('/departments/page', getDepartmentsPageController);

/** 获取部门详情 */
router.get('/departments/:dept_id', getDepartmentByIdController);

/** 获取届次列表（分页） */
router.get('/team-terms/page', getAllTeamTermsPageController);

/** 获取届次列表（全量） */
router.get('/team-terms/list', getAllTeamTermsController);

/** 获取届次详情 */
router.get('/team-terms/:term_id', getTeamTermByIdController);

/** 获取骨干成员分页列表 */
router.get('/backbone-members/page', getAllBackboneMembersPageController);

/** 获取骨干成员全量列表 */
router.get('/backbone-members/all', getAllBackboneMembersController);

/** 获取骨干成员树 */
router.get('/backbone-members/tree', getBackboneTreeController);

/** 获取活动分页列表 */
router.get('/activities/page', getAllActivitiesPageController);

/** 获取活动全量列表 */
router.get('/activities/all', getAllActivitiesController);

/** 获取活动详情 */
router.get('/activities/:activity_id', getActivityByIdController);

/** 获取荣誉记录分页列表 */
router.get('/honor-records/page', getHonorRecordsPageController);

/** 获取荣誉记录全量列表 */
router.get('/honor-records/list', getAllHonorRecordsController);

/** 获取荣誉墙 */
router.get('/honor-records/wall/list', getHonorWallController);

/** 获取荣誉墙分页 */
router.get('/honor-records/wall/page', getHonorWallPageController);

/** 获取已发布公告 */
router.get('/announcements/published', getPublishedAnnouncementsController);

/** 获取届次照片 */
router.get('/gallery-photos/term/:term_id', getPhotosByTermController);

/** 获取活动照片 */
router.get('/gallery-photos/activity/:activity_id', getPhotosByActivityController);

/** 获取届次历程（分页） */
router.get('/team-milestones/term/page/:term_id', getMilestonesByTermPageController);

/** 获取届次历程（全量） */
router.get('/team-milestones/term/list/:term_id', getMilestonesByTermController);

/** 按事件类型获取历程（分页） */
router.get('/team-milestones/type/page/:event_type', getMilestonesByTypePageController);

/** 按事件类型获取历程（全量） */
router.get('/team-milestones/type/list/:event_type', getMilestonesByTypeController);

/** 按时间范围获取历程（分页） */
router.get('/team-milestones/date-range/page', getMilestonesByDateRangePageController);

/** 按时间范围获取历程（全量） */
router.get('/team-milestones/date-range/list', getMilestonesByDateRangeController);

export default router;