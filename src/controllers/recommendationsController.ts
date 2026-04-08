import { Request, Response } from 'express';
import { successResponse, errorResponse } from '../utils/response';
import {
  getUserRecommendations,
  refreshUserRecommendations,
  getRecommendationsPage
} from '../services/recommendationsService';

/** 获取我的推荐 */
export const getMyRecommendationsController = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      errorResponse(res, '未登录或身份信息丢失', 401);
      return;
    }

    const limit = req.query.limit ? Number(req.query.limit) : 10;
    const result = await getUserRecommendations(String(user.student_id), limit);
    successResponse(res, result, '获取推荐成功');
  } catch (err: any) {
    errorResponse(res, err.message, err.status);
  }
};

/** 管理员刷新指定用户推荐 */
export const refreshRecommendationsController = async (req: Request, res: Response) => {
  try {
    const { student_id, limit } = req.body;
    if (!student_id) {
      errorResponse(res, 'student_id 不能为空', 400);
      return;
    }

    const result = await refreshUserRecommendations(String(student_id), Number(limit) || 10);
    successResponse(res, result, '刷新推荐成功');
  } catch (err: any) {
    errorResponse(res, err.message, err.status);
  }
};

/** 推荐记录分页（管理端） */
export const getRecommendationsPageController = async (req: Request, res: Response) => {
  try {
    const result = await getRecommendationsPage(req.query);
    successResponse(res, result, '获取推荐记录成功');
  } catch (err: any) {
    errorResponse(res, err.message, err.status);
  }
};
