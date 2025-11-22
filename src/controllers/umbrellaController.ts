import { successResponse, errorResponse } from '../utils/responseUtil';
import { Request, Response } from 'express';
import * as umbrellaService from '../services/umbrellaService';

// 加入新伞
export const createUmbrella = async (req: Request, res: Response): Promise<void> => {
  const { code } = req.body;
  try {
    const umbrellaInfo = await umbrellaService.createUmbrella(code);
    successResponse(res, { umbrellaInfo }, '添加新伞成功', 200);
  } catch (error) {
    errorResponse(res, error instanceof Error ? error.message : '服务器内部错误', 500);
  }
};

// 删除旧伞
export const deleteUmbrella = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.body;
  try {
    await umbrellaService.deleteUmbrella(id);
    successResponse(res, {}, '删除旧伞成功', 200);
  } catch (error) {
    errorResponse(res, error instanceof Error ? error.message : '服务器内部错误', 500);
  }
};

// 借伞
export const borrowUmbrella = async (req: Request, res: Response): Promise<void> => {
  const { auth_id, code } = req.body;
  try {
    const record = await umbrellaService.borrowUmbrella(auth_id, code);
    successResponse(res, record, '借伞成功', 201);
  } catch (error) {
    errorResponse(res, error instanceof Error ? error.message : '服务器内部错误', 500);
  }
};

// 还伞
export const returnUmbrella = async (req: Request, res: Response): Promise<void> => {
  const { auth_id, code } = req.body;
  try {
    const message = await umbrellaService.returnUmbrella(auth_id, code);
    successResponse(res, {}, message, 200);
  } catch (error) {
    errorResponse(res, error instanceof Error ? error.message : '服务器内部错误', 500);
  }
};

// 获取用户借伞记录
export const getUserUmbrellaRecords = async (req: Request, res: Response): Promise<void> => {
  const { auth_id } = req.body;
  try {
    const records = await umbrellaService.getUserUmbrellaRecords(auth_id);
    successResponse(res, { records }, '获取借伞记录成功', 200);
  } catch (error) {
    errorResponse(res, error instanceof Error ? error.message : '服务器内部错误', 500);
  }
};

// 获取所有借伞记录（仅管理员）
export const getAllUmbrellaRecords = async (req: Request, res: Response): Promise<void> => {
  try {
    const records = await umbrellaService.getAllUmbrellaRecords();
    successResponse(res, { records }, '获取所有借伞记录成功', 200);
  } catch (error) {
    errorResponse(res, error instanceof Error ? error.message : '服务器内部错误', 500);
  }
};
