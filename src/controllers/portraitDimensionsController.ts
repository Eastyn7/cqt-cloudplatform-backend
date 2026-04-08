import { Request, Response } from 'express';
import {
  createPortraitDimension,
  getPortraitDimensionsPage,
  getAllPortraitDimensions,
  getPortraitDimensionById,
  updatePortraitDimension,
  deletePortraitDimension
} from '../services/portraitDimensionsService';
import { successResponse, errorResponse } from '../utils/response';

/** 创建画像维度 */
export const createPortraitDimensionController = async (req: Request, res: Response) => {
  try {
    const result = await createPortraitDimension(req.body);
    successResponse(res, result, '创建维度成功');
  } catch (err: any) {
    errorResponse(res, err.message, err.status);
  }
};

/** 获取画像维度分页 */
export const getPortraitDimensionsPageController = async (req: Request, res: Response) => {
  try {
    const result = await getPortraitDimensionsPage(req.query);
    successResponse(res, result, '获取维度成功');
  } catch (err: any) {
    errorResponse(res, err.message, err.status);
  }
};

/** 获取画像维度全量 */
export const getAllPortraitDimensionsController = async (req: Request, res: Response) => {
  try {
    const enabled = req.query.enabled !== undefined ? Number(req.query.enabled) : undefined;
    const result = await getAllPortraitDimensions(isNaN(Number(enabled)) ? undefined : enabled);
    successResponse(res, result, '获取维度成功');
  } catch (err: any) {
    errorResponse(res, err.message, err.status);
  }
};

/** 获取单个画像维度 */
export const getPortraitDimensionByIdController = async (req: Request, res: Response) => {
  try {
    const { dimension_id } = req.params;
    const result = await getPortraitDimensionById(Number(dimension_id));
    successResponse(res, result, '获取维度成功');
  } catch (err: any) {
    errorResponse(res, err.message, err.status);
  }
};

/** 更新画像维度 */
export const updatePortraitDimensionController = async (req: Request, res: Response) => {
  try {
    const { dimension_id } = req.params;
    const result = await updatePortraitDimension(Number(dimension_id), req.body);
    successResponse(res, result, '更新维度成功');
  } catch (err: any) {
    errorResponse(res, err.message, err.status);
  }
};

/** 删除画像维度 */
export const deletePortraitDimensionController = async (req: Request, res: Response) => {
  try {
    const { dimension_id } = req.params;
    const result = await deletePortraitDimension(Number(dimension_id));
    successResponse(res, result, '删除维度成功');
  } catch (err: any) {
    errorResponse(res, err.message, err.status);
  }
};
