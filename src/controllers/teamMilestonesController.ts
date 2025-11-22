import { Request, Response } from 'express';
import {
  createMilestone,
  updateMilestone,
  deleteMilestone,
  getAllMilestones,
  getMilestonesByTerm,
  getMilestonesByType,
  getMilestonesByDateRange
} from '../services/teamMilestonesService';
import { successResponse, errorResponse } from '../utils/response';

/** 创建里程碑 */
export const createMilestoneController = async (req: Request, res: Response) => {
  try {
    req.body.created_by = req.user.student_id;
    const result = await createMilestone(req.body);
    successResponse(res, result);
  } catch (err: any) {
    errorResponse(res, err.message, err.status);
  }
};

/** 更新里程碑 */
export const updateMilestoneController = async (req: Request, res: Response) => {
  try {
    const { milestone_id } = req.params;
    const result = await updateMilestone(Number(milestone_id), req.body);
    successResponse(res, result);
  } catch (err: any) {
    errorResponse(res, err.message, err.status);
  }
};

/** 删除里程碑 */
export const deleteMilestoneController = async (req: Request, res: Response) => {
  try {
    const { milestone_id } = req.params;
    const result = await deleteMilestone(Number(milestone_id));
    successResponse(res, result);
  } catch (err: any) {
    errorResponse(res, err.message, err.status);
  }
};

/** 后台里程碑列表 */
export const getAllMilestonesController = async (_req: Request, res: Response) => {
  try {
    const result = await getAllMilestones();
    successResponse(res, result);
  } catch (err: any) {
    errorResponse(res, err.message, err.status);
  }
};

/** 门户-按届次筛选里程碑 */
export const getMilestonesByTermController = async (req: Request, res: Response) => {
  try {
    const { term_id } = req.params;
    const result = await getMilestonesByTerm(Number(term_id));
    successResponse(res, result);
  } catch (err: any) {
    errorResponse(res, err.message, err.status);
  }
};

/** 门户-按类型筛选里程碑 */
export const getMilestonesByTypeController = async (req: Request, res: Response) => {
  try {
    const { event_type } = req.params;
    const result = await getMilestonesByType(event_type);
    successResponse(res, result);
  } catch (err: any) {
    errorResponse(res, err.message, err.status);
  }
};

/** 门户-按时间范围筛选里程碑 */
export const getMilestonesByDateRangeController = async (
  req: Request,
  res: Response
) => {
  try {
    const { start, end } = req.query;
    const result = await getMilestonesByDateRange(
      String(start),
      String(end)
    );

    successResponse(res, result);
  } catch (err: any) {
    errorResponse(res, err.message, err.status);
  }
};