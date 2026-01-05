import { Request, Response } from 'express';
import { getSTSForOSS } from '../services/stsService';
import { successResponse, errorResponse } from '../utils/response';

export const getSTS = async (req: Request, res: Response) => {
  try {
    const sts = await getSTSForOSS();
    successResponse(res, sts, 'STS 获取成功');
  } catch (error: any) {
    console.error('STS 获取失败:', error);
    errorResponse(res, 'STS 获取失败', 500);
  }
};