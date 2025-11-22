import { Request, Response } from 'express';
import { successResponse, errorResponse, HTTP_STATUS } from '../utils/response';
import {
  getParticipantsByActivity,
  joinActivity,
  cancelActivity,
  markSignIn,
  updateServiceHours,
  batchUpdateServiceHours,
  getRecordsByStudent,
  getAllParticipants
} from '../services/activityParticipantsService';

/** 获取活动报名名单 */
export const getParticipantsByActivityController = async (req: Request, res: Response) => {
  try {
    const { activity_id } = req.params;
    const result = await getParticipantsByActivity(Number(activity_id));
    successResponse(res, result, '获取活动报名名单成功');
  } catch (error: any) {
    errorResponse(res, error.message, error.status);
  }
};

/** 学生报名活动 */
export const joinActivityController = async (req: Request, res: Response) => {
  try {
    const { activity_id, student_id } = req.body;
    const user = (req as any).user;

    if (user.role !== 'admin' && user.role !== 'superadmin' && user.student_id !== student_id) {
      errorResponse(res, '不能为别人报名活动！', HTTP_STATUS.FORBIDDEN);
      return;
    }

    const result = await joinActivity(Number(activity_id), student_id);
    successResponse(res, result, '报名成功');
  } catch (error: any) {
    errorResponse(res, error.message, error.status);
  }
};

/** 取消活动报名 */
export const cancelActivityController = async (req: Request, res: Response) => {
  try {
    const { activity_id, student_id } = req.params;
    const user = (req as any).user;

    if (user.role !== 'admin' && user.role !== 'superadmin' && user.student_id !== student_id) {
      errorResponse(res, '不能取消别人报名的活动！', HTTP_STATUS.FORBIDDEN);
      return;
    }

    const result = await cancelActivity(Number(activity_id), student_id);
    successResponse(res, result, '取消报名成功');
  } catch (error: any) {
    errorResponse(res, error.message, error.status);
  }
};

/** 活动签到/取消签到 */
export const markSignInController = async (req: Request, res: Response) => {
  try {
    const { record_id } = req.params;
    const { signed_in } = req.body;
    const result = await markSignIn(Number(record_id), signed_in);
    successResponse(res, result, '签到状态更新成功');
  } catch (error: any) {
    errorResponse(res, error.message, error.status);
  }
};

/** 单个更新服务时长 */
export const updateServiceHoursController = async (req: Request, res: Response) => {
  try {
    const { record_id } = req.params;
    const { service_hours } = req.body;
    const result = await updateServiceHours(Number(record_id), Number(service_hours));
    successResponse(res, result, '服务时长更新成功');
  } catch (error: any) {
    errorResponse(res, error.message, error.status);
  }
};

/** 批量更新服务时长 */
export const batchUpdateServiceHoursController = async (req: Request, res: Response) => {
  try {
    const { updates } = req.body;
    const result = await batchUpdateServiceHours(updates);
    successResponse(res, result, '批量服务时长更新成功');
  } catch (error: any) {
    errorResponse(res, error.message, error.status);
  }
};

/** 获取学生个人报名记录 */
export const getRecordsByStudentController = async (req: Request, res: Response) => {
  try {
    const { student_id } = req.params;
    const user = (req as any).user;

    if (user.role !== 'admin' && user.role !== 'superadmin' && user.student_id !== student_id) {
      errorResponse(res, '无权查看他人报名记录', HTTP_STATUS.FORBIDDEN);
      return;
    }

    const result = await getRecordsByStudent(student_id);
    successResponse(res, result, '获取个人报名记录成功');
  } catch (error: any) {
    errorResponse(res, error.message, error.status);
  }
};

/** 获取所有活动参与记录 */
export const getAllParticipantsController = async (req: Request, res: Response) => {
  try {
    const result = await getAllParticipants();
    successResponse(res, result, '获取所有活动参与记录成功');
  } catch (error: any) {
    errorResponse(res, error.message, error.status);
  }
};