import { Request, Response } from 'express';
import { getUserPortrait } from '../services/portraitService';
import { successResponse, errorResponse } from '../utils/response';

/** 获取个人画像数据 */
export const getPortraitController = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      errorResponse(res, '未登录或身份信息丢失', 401);
      return;
    }

    const isAdmin = user.role === 'admin' || user.role === 'superadmin';
    const studentId = isAdmin && req.query.student_id
      ? String(req.query.student_id)
      : String(user.student_id);

    const result = await getUserPortrait(studentId);
    successResponse(res, result, '获取个人画像成功');
  } catch (error: any) {
    errorResponse(res, error.message, error.status);
  }
};
