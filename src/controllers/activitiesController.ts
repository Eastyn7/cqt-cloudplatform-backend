import { Request, Response } from 'express';
import {
  createActivity,
  updateActivity,
  deleteActivity,
  getAllActivitiesPage,
  getActivityById,
  changeActivityStatus,
  getAllActivities,
  getActivityCategories
} from '../services/activitiesService';
import { successResponse, errorResponse } from '../utils/response';

/** 创建志愿活动 */
export const createActivityController = async (req: Request, res: Response) => {
  try {
    const result = await createActivity(req.body);
    successResponse(res, result, '活动创建成功');
  } catch (error: any) {
    errorResponse(res, error.message, error.status);
  }
};

/** 更新志愿活动 */
export const updateActivityController = async (req: Request, res: Response) => {
  try {
    const { activity_id } = req.params;
    const result = await updateActivity(Number(activity_id), req.body);
    successResponse(res, result, '活动更新成功');
  } catch (error: any) {
    errorResponse(res, error.message, error.status);
  }
};

/** 删除志愿活动 */
export const deleteActivityController = async (req: Request, res: Response) => {
  try {
    const { activity_id } = req.params;
    const result = await deleteActivity(Number(activity_id));
    successResponse(res, result, '活动删除成功');
  } catch (error: any) {
    errorResponse(res, error.message, error.status);
  }
};

/** 获取所有志愿活动（分页） */
export const getAllActivitiesPageController = async (req: Request, res: Response) => {
  try {
    const result = await getAllActivitiesPage(req.query);
    successResponse(res, result, '查询所有活动成功');
  } catch (error: any) {
    errorResponse(res, error.message, error.status);
  }
};

/** 获取活动详情 */
export const getActivityByIdController = async (req: Request, res: Response) => {
  try {
    const { activity_id } = req.params;
    const result = await getActivityById(Number(activity_id));
    successResponse(res, result, '查询活动详情成功');
  } catch (error: any) {
    errorResponse(res, error.message, error.status);
  }
};

/** 切换活动状态 */
export const changeActivityStatusController = async (req: Request, res: Response) => {
  try {
    const { activity_id } = req.params;
    const { status } = req.body;
    const result = await changeActivityStatus(Number(activity_id), status);
    successResponse(res, result, '活动状态更新成功');
  } catch (error: any) {
    errorResponse(res, error.message, error.status);
  }
};

/** 获取所有志愿活动（全量） */
export const getAllActivitiesController = async (req: Request, res: Response) => {
  try {
    const result = await getAllActivities();
    successResponse(res, result, '查询所有活动成功');
  } catch (error: any) {
    errorResponse(res, error.message, error.status);
  }
};

/** 获取所有活动的活动类别 */
export const getActivityCategoriesController = async (req: Request, res: Response) => {
  try {
    const result = await getActivityCategories();
    successResponse(res, result, '获取活动类别成功');
  } catch (error: any) {
    errorResponse(res, error.message, error.status);
  }
};