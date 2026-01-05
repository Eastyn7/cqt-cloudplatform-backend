import { Request, Response } from 'express';
import {
  createPhoto,
  updatePhoto,
  deletePhoto,
  getAllPhotosPage,
  getPhotosByTermPage,
  getPhotosByActivityPage
} from '../services/galleryPhotosService';
import { successResponse, errorResponse } from '../utils/response';

/** 创建照片 */
export const createPhotoController = async (req: Request, res: Response) => {
  try {
    req.body.uploaded_by = req.user.student_id;
    const result = await createPhoto(req.body);
    successResponse(res, result);
  } catch (err: any) {
    errorResponse(res, err.message, err.status);
  }
};

/** 更新照片 */
export const updatePhotoController = async (req: Request, res: Response) => {
  try {
    const { photo_id } = req.params;
    if (req.body.image_key) {
      req.body.uploaded_by = req.user.student_id;
    }
    const result = await updatePhoto(Number(photo_id), req.body);
    successResponse(res, result);
  } catch (err: any) {
    errorResponse(res, err.message, err.status);
  }
};

/** 删除照片 */
export const deletePhotoController = async (req: Request, res: Response) => {
  try {
    const { photo_id } = req.params;
    const result = await deletePhoto(Number(photo_id));
    successResponse(res, result);
  } catch (err: any) {
    errorResponse(res, err.message, err.status);
  }
};

/** 后台照片列表 */
export const getAllPhotosController = async (req: Request, res: Response) => {
  try {
    const result = await getAllPhotosPage(req.query);
    successResponse(res, result);
  } catch (err: any) {
    errorResponse(res, err.message, err.status);
  }
};

/** 门户-按届次显示照片 */
export const getPhotosByTermController = async (req: Request, res: Response) => {
  try {
    const { term_id } = req.params;
    const result = await getPhotosByTermPage(Number(term_id), req.query);
    successResponse(res, result);
  } catch (err: any) {
    errorResponse(res, err.message, err.status);
  }
};

/** 门户-按活动显示照片 */
export const getPhotosByActivityController = async (req: Request, res: Response) => {
  try {
    const { activity_id } = req.params;
    const result = await getPhotosByActivityPage(Number(activity_id), req.query);
    successResponse(res, result);
  } catch (err: any) {
    errorResponse(res, err.message, err.status);
  }
};