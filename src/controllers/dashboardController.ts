import { Request, Response } from 'express';
import { getDashboardData } from '../services/dashboardService';
import { successResponse, errorResponse } from '../utils/response';

/**
 * 获取驾驶舱数据
 * @route GET /api/dashboard/data
 * @query timeRange - 时间范围: '30d' | '90d' | '1y' | 'all'
 */
export const getDashboardDataController = async (req: Request, res: Response) => {
  try {
    const { timeRange = '30d' } = req.query;
    const result = await getDashboardData(String(timeRange));
    successResponse(res, result, '获取驾驶舱数据成功');
  } catch (error: any) {
    errorResponse(res, error.message, error.status);
  }
};
