import { Request, Response } from 'express';
import {
  getCurrentSeason,
  getSeasonList,
  openSeason,
  closeAllSeasons,
  closeSeason,
  deleteSeason,
} from '../services/recruitmentSeasonsService';
import { RecruitmentType } from '../types/dbTypes';
import { successResponse, errorResponse } from '../utils/response';

/** 用户端：获取当前可报名的通道 */
export const getCurrentController = async (req: Request, res: Response) => {
  try {
    const season = await getCurrentSeason();
    successResponse(res, { season }, '当前报名通道获取成功');
  } catch (err: any) {
    errorResponse(res, err.message, err.status);
  }
};

/** 管理端：列表 + 开关操作 */
export const listController = async (req: Request, res: Response) => {
  try {
    const data = await getSeasonList(req.query);
    successResponse(res, data, '报名通道列表获取成功');
  } catch (err: any) {
    errorResponse(res, err.message, err.status);
  }
};

/** 管理端：开启新一季报名 */
export const openController = async (req: Request, res: Response) => {
  try {
    const result = await openSeason(req.body);
    successResponse(res, result, '报名通道开启成功');
  } catch (err: any) {
    errorResponse(res, err.message, err.status);
  }
};

/** 管理端：关闭报名通道 */
export const closeAllController = async (req: Request, res: Response) => {
  try {
    const result = await closeAllSeasons();
    successResponse(res, result, '所有报名通道已关闭');
  } catch (err: any) {
    errorResponse(res, err.message, err.status);
  }
};

/** 管理端：关闭指定报名通道 */
export const closeOneController = async (req: Request, res: Response) => {
  try {
    const { year, type } = req.body;
    const result = await closeSeason(year, type);
    successResponse(res, result, '报名通道已关闭');
  } catch (err: any) {
    errorResponse(res, err.message, err.status);
  }
};

/** 管理端：删除指定报名通道 */
export const deleteController = async (req: Request, res: Response) => {
  try {
    const { year, type } = req.body;
    if (!year || !type) {
      throw { status: 400, message: 'year 和 type 必填' };
    }
    const result = await deleteSeason(Number(year), type as RecruitmentType);
    successResponse(res, result, '报名通道已删除');
  } catch (err: any) {
    errorResponse(res, err.message || '删除失败', err.status || 500);
  }
};