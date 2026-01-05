import { Request, Response } from 'express';
import {
  sendVerificationCodeService,
  verifyCodeService,
  cleanupVerificationCodesService,
  getVerificationCodesPage,
} from '../services/emailService';
import { successResponse, errorResponse, HTTP_STATUS } from '../utils/response';

/** 发送邮箱验证码 */
export const sendVerificationCodeController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, type = 'register' } = req.body;

    if (!email) {
      errorResponse(res, '邮箱不能为空', HTTP_STATUS.BAD_REQUEST);
      return;
    }

    await sendVerificationCodeService(email, type);
    successResponse(res, null, '验证码已发送，请查收邮箱');
  } catch (error: any) {
    console.error('发送验证码失败:', error.message);
    errorResponse(res, error.message || '发送验证码失败', HTTP_STATUS.INTERNAL_ERROR);
  }
};

/** 验证邮箱验证码 */
export const verifyEmailCodeController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, code, type = 'register' } = req.body;

    if (!email || !code) {
      errorResponse(res, '邮箱和验证码不能为空', HTTP_STATUS.BAD_REQUEST);
      return;
    }

    const isValid = await verifyCodeService(email, code, type);
    if (!isValid) {
      errorResponse(res, '验证码无效或已过期', HTTP_STATUS.BAD_REQUEST);
      return;
    }

    successResponse(res, null, '邮箱验证成功');
  } catch (error: any) {
    console.error('验证邮箱验证码失败:', error.message);
    errorResponse(res, '验证失败，请稍后再试', HTTP_STATUS.INTERNAL_ERROR);
  }
};

/** 清理验证码记录 */
export const cleanupVerificationCodesController = async (req: Request, res: Response): Promise<void> => {
  try {
    const daysBefore = req.query.daysBefore ? Number(req.query.daysBefore) : undefined;
    const deletedCount = await cleanupVerificationCodesService(daysBefore);

    successResponse(res, { deleted: deletedCount }, `清理完成，共删除 ${deletedCount} 条记录`);
  } catch (error: any) {
    console.error('清理验证码记录失败:', error.message);
    errorResponse(res, '清理失败，请稍后再试', HTTP_STATUS.INTERNAL_ERROR);
  }
};

/** 获取验证码列表 */
export const getAllVerificationCodesController = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await getVerificationCodesPage(req.query);

    successResponse(res, result, '查询成功');
  } catch (error: any) {
    console.error('获取验证码列表失败:', error.message);
    errorResponse(res, '获取失败，请稍后再试', HTTP_STATUS.INTERNAL_ERROR);
  }
};