import { Request, Response } from 'express';
import {
  createTeamTerm,
  getAllTeamTermsPage,
  getAllTeamTerms,
  getTeamTermById,
  updateTeamTerm,
  deleteTeamTerm,
  batchCreateTeamTerms
} from '../services/teamTermsService';
import { successResponse, errorResponse } from '../utils/response';

/** 创建届次 */
export const createTeamTermController = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await createTeamTerm(req.body);
    successResponse(res, result, '届次创建成功');
  } catch (error: any) {
    errorResponse(res, error.message, error.status);
  }
};

/** 获取所有届次（分页） */
export const getAllTeamTermsPageController = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await getAllTeamTermsPage(req.query);
    successResponse(res, result, '查询所有届次成功');
  } catch (error: any) {
    errorResponse(res, error.message, error.status);
  }
};

/** 获取所有届次（全量） */
export const getAllTeamTermsController = async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await getAllTeamTerms();
    successResponse(res, result, '查询所有届次成功');
  } catch (error: any) {
    errorResponse(res, error.message, error.status);
  }
};

/** 获取单个届次信息 */
export const getTeamTermByIdController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { term_id } = req.params;
    const result = await getTeamTermById(Number(term_id));
    successResponse(res, result, '查询届次信息成功');
  } catch (error: any) {
    errorResponse(res, error.message, error.status);
  }
};

/** 更新届次信息 */
export const updateTeamTermController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { term_id } = req.params;
    const result = await updateTeamTerm(Number(term_id), req.body);
    successResponse(res, result, '届次信息更新成功');
  } catch (error: any) {
    errorResponse(res, error.message, error.status);
  }
};

/** 删除届次 */
export const deleteTeamTermController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { term_id } = req.params;
    const result = await deleteTeamTerm(Number(term_id));
    successResponse(res, result, '届次删除成功');
  } catch (error: any) {
    errorResponse(res, error.message, error.status);
  }
};

/** 批量创建届次 */
export const batchCreateTeamTermsController = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await batchCreateTeamTerms(req.body);
    successResponse(res, result, '批量创建届次成功');
  } catch (error: any) {
    errorResponse(res, error.message, error.status);
  }
};