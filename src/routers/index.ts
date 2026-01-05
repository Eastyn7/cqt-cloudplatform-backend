import { Router } from 'express';

// 子模块路由引入
import publicRouter from './publicRouter';
// import ossRouter from './ossRouter';
import emailRouter from './emailRouter';
import authLoginRouter from './auth/authLoginRouter';
import authInfoRouter from './auth/authInfoRouter';
import departmentsRouter from './departmentsRouter';
import teamTermsRouter from './teamTermsRouter';
import backboneMembersRouter from './backboneMembersRouter';
import activitiesRouter from './activitiesRouter';
import activityParticipantsRouter from './activityParticipantsRouter';
import honorRecordsRouter from './honorRecordsRouter';
import announcementsRouter from './announcementsRouter';
import galleryPhotosRouter from './galleryPhotosRouter';
import teamMilestonesRouter from './teamMilestonesRouter';
import operationLogsRouter from './operationLogsRouter';
import stsRoouter from './stsRouter';
import recruitmentSeasonsRouter from './recruitmentSeasonsRouter';
import teamRecruitmentRouter from './teamRecruitmentRouter';

// 创建主路由
const router = Router();

// 挂载子路由（统一添加路径前缀）
router.use('/public', publicRouter);
// router.use('/oss', ossRouter);
router.use('/email', emailRouter);
router.use('/auth/login', authLoginRouter);
router.use('/auth/info', authInfoRouter);
router.use('/departments', departmentsRouter);
router.use('/team-terms', teamTermsRouter);
router.use('/backbone-members', backboneMembersRouter);
router.use('/activities', activitiesRouter);
router.use('/activity-participants', activityParticipantsRouter);
router.use('/honor-records', honorRecordsRouter);
router.use('/announcements', announcementsRouter);
router.use('/gallery-photos', galleryPhotosRouter);
router.use('/team-milestones', teamMilestonesRouter);
router.use('/operation-logs', operationLogsRouter);
router.use('/oss', stsRoouter);
router.use('/recruitment-seasons', recruitmentSeasonsRouter);
router.use('/team-recruitment', teamRecruitmentRouter);

export default router;