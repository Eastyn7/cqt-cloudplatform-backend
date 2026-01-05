import { Request, Response, NextFunction } from 'express';
import { errorResponse, HTTP_STATUS } from '../utils/response';
import { createValidator, createBatchValidator } from "./validateFactory";
import {
  AuthLoginSchema,
  RegistrationSchema,
  LoginSchema,
  BatchRegistrationSchema,
  BatchDeleteAuthSchema,
  ChangePasswordSchema,
  SetAdminSchema,
  BatchSetUserRolesSchema,
  AuthInfoSchema,
  DepartmentSchema,
  TeamTermSchema,
  BackboneMemberSchema,
  ActivitySchema,
  ActivityParticipantSchema,
  HonorSchema,
  AnnouncementSchema,
  GalleryPhotoSchema,
  TeamMilestoneSchema,
  OperationLogSchema,
  EmailVerificationCodeSchema,
  SendEmailCodeSchema,
  VerifyEmailCodeSchema,
  SeasonControlSchema,
  RecruitmentApplySchema,
  ReviewStageSchema,
  AssignDeptSchema,
} from "./validateSchemas";

/* ---------------------------
 * AuthLogin
 * --------------------------- */
export const validateAuthLoginCreate = createValidator(AuthLoginSchema, "create");
export const validateAuthLoginUpdate = createValidator(AuthLoginSchema, "update");

/* ---------------------------
 * 注册 | 批量注册
 * --------------------------- */
export const validateRegistration = createValidator(RegistrationSchema, "create");
export const validateBatchRegister = createBatchValidator(BatchRegistrationSchema, "create");

/* ---------------------------
 * 登录
 * --------------------------- */
export const validateLogin = createValidator(LoginSchema, "create");

/* ---------------------------
 * 批量删除用户
 * --------------------------- */
export const validateBatchDelete = (req: Request, res: Response, next: NextFunction) => {
  const { studentIds } = req.body;

  if (!Array.isArray(studentIds) || studentIds.length === 0) {
    errorResponse(res, "请求体必须为非空数组", HTTP_STATUS.BAD_REQUEST);
    return;
  }

  // 校验每个 ID 格式
  for (const id of studentIds) {
    const valid = BatchDeleteAuthSchema.student_id.validator?.(id);
    if (!valid) {
      errorResponse(res, `学号格式错误：${id}`, HTTP_STATUS.BAD_REQUEST);
    }
  }

  next();
};

/* ---------------------------
 * 修改密码
 * --------------------------- */
export const validateChangePassword = (req: Request, res: Response, next: NextFunction) => {
  const validator = createValidator(ChangePasswordSchema);

  const error = validator.syncValidate(req.body);
  if (error) {
    errorResponse(res, error, HTTP_STATUS.BAD_REQUEST);
    return;
  }

  const { oldPassword, newPassword } = req.body;
  if (oldPassword === newPassword) {
    errorResponse(res, "新旧密码不能一致", HTTP_STATUS.BAD_REQUEST);
    return;
  }

  next();
};

/* ---------------------------
 * 设置管理员
 * --------------------------- */
export const validateSetAdmin = createValidator(SetAdminSchema, "create");

/* ---------------------------
 * 批量设置用户角色
 * --------------------------- */
export const validateBatchSetUserRoles = createValidator(BatchSetUserRolesSchema, "create");

/* ---------------------------
 * AuthInfo
 * --------------------------- */
export const validateAuthInfoCreate = createValidator(AuthInfoSchema, "create");
export const validateAuthInfoUpdate = createValidator(AuthInfoSchema, "update");
export const validateBatchAuthInfoCreate = createBatchValidator(AuthInfoSchema, "create");

/* ---------------------------
 * Department
 * --------------------------- */
export const validateDepartmentCreate = createValidator(DepartmentSchema, "create");
export const validateDepartmentUpdate = createValidator(DepartmentSchema, "update");
export const validateBatchDepartmentCreate = createBatchValidator(DepartmentSchema, "create");

/* ---------------------------
 * TeamTerm
 * --------------------------- */
export const validateTeamTermCreate = createValidator(TeamTermSchema, "create");
export const validateTeamTermUpdate = createValidator(TeamTermSchema, "update");
export const validateBatchTeamTermCreate = createBatchValidator(TeamTermSchema, "create");

/* ---------------------------
 * BackboneMember
 * --------------------------- */
export const validateBackboneMemberCreate = createValidator(BackboneMemberSchema, "create");
export const validateBackboneMemberUpdate = createValidator(BackboneMemberSchema, "update");
export const validateBatchBackboneMemberCreate = createBatchValidator(BackboneMemberSchema, "create");

/* ---------------------------
 * Activity
 * --------------------------- */
export const validateActivityCreate = createValidator(ActivitySchema, "create");
export const validateActivityUpdate = createValidator(ActivitySchema, "update");

/* ---------------------------
 * ActivityParticipant
 * --------------------------- */
export const validateActivityParticipantCreate = createValidator(ActivityParticipantSchema, "create");
export const validateActivityParticipantUpdate = createValidator(ActivityParticipantSchema, "update");
export const validateBatchActivityParticipantUpdate = createBatchValidator(ActivityParticipantSchema, "update");

/* ---------------------------
 * Honor
 * --------------------------- */
export const validateHonorCreate = createValidator(HonorSchema, "create");
export const validateHonorUpdate = createValidator(HonorSchema, "update");
export const validateBatchHonorCreate = createBatchValidator(HonorSchema, "create");

/* ---------------------------
 * Announcement
 * --------------------------- */
export const validateAnnouncementCreate = createValidator(AnnouncementSchema, "create");
export const validateAnnouncementUpdate = createValidator(AnnouncementSchema, "update");

/* ---------------------------
 * GalleryPhoto
 * --------------------------- */
export const validateGalleryPhotoCreate = createValidator(GalleryPhotoSchema, "create");
export const validateGalleryPhotoUpdate = createValidator(GalleryPhotoSchema, "update");

/* ---------------------------
 * TeamMilestone
 * --------------------------- */
export const validateTeamMilestoneCreate = createValidator(TeamMilestoneSchema, "create");
export const validateTeamMilestoneUpdate = createValidator(TeamMilestoneSchema, "update");

/* ---------------------------
 * OperationLog
 * --------------------------- */
export const validateOperationLogCreate = createValidator(OperationLogSchema, "create");
export const validateOperationLogUpdate = createValidator(OperationLogSchema, "update");

/* ---------------------------
 * EmailVerificationCode
 * --------------------------- */
export const validateEmailVerificationCodeCreate = createValidator(EmailVerificationCodeSchema, "create");
export const validateEmailVerificationCodeUpdate = createValidator(EmailVerificationCodeSchema, "update");

/* ---------------------------
 * 发送验证码 | 验证验证码
 * --------------------------- */
export const validateSendEmailCode = createValidator(SendEmailCodeSchema, "create");
export const validateVerifyEmailCode = createValidator(VerifyEmailCodeSchema, "create");

/* ---------------------------
 * SeasonControl
 * --------------------------- */
export const validateSeasonControl = createValidator(SeasonControlSchema, "create");

/* ---------------------------
 * Recruitment
 * --------------------------- */
export const validateRecruitmentApply = createValidator(RecruitmentApplySchema, "create");
export const validateReviewStage = createValidator(ReviewStageSchema, "create");
export const validateAssignDept = createValidator(AssignDeptSchema, "create");