import { Request, Response } from 'express';
import {
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  getAllAnnouncements,
  getPublishedAnnouncements
} from '../services/announcementsService';
import { successResponse, errorResponse } from '../utils/response';

/** 创建公告 */
export const createAnnouncementController = async (req: Request, res: Response) => {
  try {
    const result = await createAnnouncement(req.body);
    successResponse(res, result);
  } catch (err: any) {
    errorResponse(res, err.message, err.status);
  }
};

/** 更新公告 */
export const updateAnnouncementController = async (req: Request, res: Response) => {
  try {
    const { announcement_id } = req.params;
    const result = await updateAnnouncement(Number(announcement_id), req.body);
    successResponse(res, result);
  } catch (err: any) {
    errorResponse(res, err.message, err.status);
  }
};

/** 删除公告 */
export const deleteAnnouncementController = async (req: Request, res: Response) => {
  try {
    const { announcement_id } = req.params;
    const result = await deleteAnnouncement(Number(announcement_id));
    successResponse(res, result, '公告删除成功');
  } catch (error: any) {
    errorResponse(res, error.message, error.status);
  }
};

/** 获取所有公告（后台） */
export const getAllAnnouncementsController = async (_req: Request, res: Response) => {
  try {
    const result = await getAllAnnouncements();
    successResponse(res, result, '查询公告成功');
  } catch (error: any) {
    errorResponse(res, error.message, error.status);
  }
};

/** 获取已发布公告（门户） */
export const getPublishedAnnouncementsController = async (_req: Request, res: Response) => {
  try {
    const result = await getPublishedAnnouncements();
    successResponse(res, result, '查询已发布公告成功');
  } catch (error: any) {
    errorResponse(res, error.message, error.status);
  }
};