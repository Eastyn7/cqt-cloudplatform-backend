import { Request, Response } from 'express';
import { successResponse, errorResponse } from '../utils/responseUtil';
import * as backboneMemberService from '../services/backboneMembersService';

/**
 * 创建骨干成员
 */
export const createBackboneMember = async (req: Request, res: Response): Promise<void> => {
  const { auth_id, department_id, role_id, role_name, photo, description } = req.body;
  if (!auth_id || !department_id || !role_id) {
    errorResponse(res, '缺少必要参数', 400);
  }
  try {
    const newMember = await backboneMemberService.createBackboneMember(auth_id, department_id, role_id, role_name, photo, description);
    successResponse(res, newMember, '创建骨干成员成功', 201);
  } catch (error) {
    errorResponse(res, error instanceof Error ? error.message : '服务器内部错误', 500);
  }
};

/**
 * 获取所有骨干成员
 */
export const getBackboneMembers = async (req: Request, res: Response): Promise<void> => {
  try {
    const members = await backboneMemberService.getBackboneMembers();
    successResponse(res, { members }, '获取骨干成员列表成功', 200);
  } catch (error) {
    errorResponse(res, error instanceof Error ? error.message : '服务器内部错误', 500);
  }
};

/**
 * 获取单个骨干成员
 */
export const getBackboneMember = async (req: Request, res: Response): Promise<void> => {
  const { auth_id } = req.body;
  try {
    const member = await backboneMemberService.getBackboneMember(auth_id);
    successResponse(res, { member }, '获取骨干成员成功', 200);
  } catch (error) {
    errorResponse(res, error instanceof Error ? error.message : '服务器内部错误', 500);
  }
};

/**
 * 更新骨干成员信息
 */
export const updateBackboneMember = async (req: Request, res: Response): Promise<void> => {
  const { auth_id, updates } = req.body;
  try {
    const result = await backboneMemberService.updateBackboneMember(auth_id, updates);
    successResponse(res, {}, result, 200);
  } catch (error) {
    errorResponse(res, error instanceof Error ? error.message : '服务器内部错误', 500);
  }
};

/**
 * 删除骨干成员
 */
export const deleteBackboneMember = async (req: Request, res: Response): Promise<void> => {
  const { auth_id } = req.body;
  try {
    const result = await backboneMemberService.deleteBackboneMember(auth_id);
    successResponse(res, {}, result, 200);
  } catch (error) {
    errorResponse(res, error instanceof Error ? error.message : '服务器内部错误', 500);
  }
};
