import { Request, Response } from 'express';
import {
  createBackboneMember,
  updateBackboneMember,
  deleteBackboneMember,
  getAllBackboneMembersPage,
  getAllBackboneMembers,
  getBackboneTree,
  batchCreateBackboneMembers
} from '../services/backboneMembersService';
import { successResponse, errorResponse } from '../utils/response';

/** 创建骨干成员 */
export const createBackboneMemberController = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await createBackboneMember(req.body);
    successResponse(res, result, '骨干成员创建成功');
  } catch (error: any) {
    errorResponse(res, error.message, error.status);
  }
};

/** 更新骨干成员信息 */
export const updateBackboneMemberController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { member_id } = req.params;
    const result = await updateBackboneMember(Number(member_id), req.body);
    successResponse(res, result, '骨干成员信息更新成功');
  } catch (error: any) {
    errorResponse(res, error.message, error.status);
  }
};

/** 删除骨干成员 */
export const deleteBackboneMemberController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { member_id } = req.params;
    const result = await deleteBackboneMember(Number(member_id));
    successResponse(res, result, '骨干成员删除成功');
  } catch (error: any) {
    errorResponse(res, error.message, error.status);
  }
};

/** 获取所有骨干成员（分页） */
export const getAllBackboneMembersPageController = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await getAllBackboneMembersPage(req.query);
    successResponse(res, result, '查询所有骨干成员成功');
  } catch (error: any) {
    errorResponse(res, error.message, error.status);
  }
};

/** 获取所有骨干成员（全量） */
export const getAllBackboneMembersController = async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await getAllBackboneMembers();
    successResponse(res, result, '查询所有骨干成员成功');
  } catch (error: any) {
    errorResponse(res, error.message, error.status);
  }
};

/** 获取骨干成员树状结构（届次→部门→成员） */
export const getBackboneTreeController = async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await getBackboneTree();
    successResponse(res, result, '查询骨干成员树状结构成功');
  } catch (error: any) {
    errorResponse(res, error.message, error.status);
  }
};

/** 批量创建骨干成员 */
export const batchCreateBackboneMembersController = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await batchCreateBackboneMembers(req.body);
    successResponse(res, result, '批量创建骨干成员成功');
  } catch (error: any) {
    errorResponse(res, error.message, error.status);
  }
};