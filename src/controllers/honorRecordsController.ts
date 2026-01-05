import { Request, Response } from 'express';
import {
  createHonorRecord,
  updateHonorRecord,
  deleteHonorRecord,
  getAllHonorRecords,
  getHonorWallAll,
  getHonorRecordsPage,
  getHonorWallPage,
  batchCreateHonorRecords
} from '../services/honorRecordsService';
import { successResponse, errorResponse } from '../utils/response';

/** 创建荣誉记录 */
export const createHonorRecordController = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await createHonorRecord(req.body);
    successResponse(res, result, '荣誉记录创建成功');
  } catch (error: any) {
    errorResponse(res, error.message, error.status);
  }
};

/** 更新荣誉记录 */
export const updateHonorRecordController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { honor_id } = req.params;
    const result = await updateHonorRecord(Number(honor_id), req.body);
    successResponse(res, result, '荣誉记录更新成功');
  } catch (error: any) {
    errorResponse(res, error.message, error.status);
  }
};

/** 删除荣誉记录 */
export const deleteHonorRecordController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { honor_id } = req.params;
    const result = await deleteHonorRecord(Number(honor_id));
    successResponse(res, result, '荣誉记录删除成功');
  } catch (error: any) {
    errorResponse(res, error.message, error.status);
  }
};

/** 获取所有荣誉记录 */
export const getAllHonorRecordsController = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await getAllHonorRecords();
    successResponse(res, result, '查询所有荣誉记录成功');
  } catch (error: any) {
    errorResponse(res, error.message, error.status);
  }
};

/** 获取荣誉记录（分页） */
export const getHonorRecordsPageController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const result = await getHonorRecordsPage(req.query);
    successResponse(res, result, '查询荣誉记录分页成功');
  } catch (error: any) {
    errorResponse(res, error.message, error.status);
  }
};


/** 获取历届荣誉墙（按届次分组） */
export const getHonorWallController = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await getHonorWallAll();
    successResponse(res, result, '查询荣誉墙成功');
  } catch (error: any) {
    errorResponse(res, error.message, error.status);
  }
};

/** 获取荣誉墙（分页） */
export const getHonorWallPageController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const result = await getHonorWallPage(req.query);
    successResponse(res, result, '查询荣誉墙分页成功');
  } catch (error: any) {
    errorResponse(res, error.message, error.status);
  }
};

/** 批量创建荣誉记录 */
export const batchCreateHonorRecordsController = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await batchCreateHonorRecords(req.body);
    successResponse(res, result, '批量创建荣誉记录成功');
  } catch (error: any) {
    errorResponse(res, error.message, error.status);
  }
};