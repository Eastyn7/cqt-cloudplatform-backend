import { Request, Response } from 'express';
import {
  updateUserInfo,
  getUserInfo,
  getUsersInfoPage,
  getAllUsersInfo,
  batchImportUsersInfo,
  getCollegesAndMajors,
  getAllAdminsInfo
} from '../../services/auth/authInfoService';
import { successResponse, errorResponse, HTTP_STATUS } from '../../utils/response';

/** 更新用户信息 */
export const updateUserInfoController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { student_id } = req.params;
    const user = (req as any).user;

    if (user.role !== 'admin' && user.role !== 'superadmin' && user.student_id !== student_id) {
      errorResponse(res, '权限不足，不能修改他人信息', HTTP_STATUS.FORBIDDEN);
      return;
    }

    const result = await updateUserInfo(student_id, req.body);
    successResponse(res, result, '用户信息更新成功');
  } catch (error: any) {
    errorResponse(res, error.message, error.status);
  }
};

/** 查询单个用户信息 */
export const getUserInfoController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { student_id } = req.params;
    const user = (req as any).user;

    if (user.role !== 'admin' && user.role !== 'superadmin' && user.student_id !== student_id) {
      errorResponse(res, '权限不足，不能查看他人信息', HTTP_STATUS.FORBIDDEN);
      return;
    }

    const result = await getUserInfo(student_id);
    successResponse(res, result, '查询用户信息成功');
  } catch (error: any) {
    errorResponse(res, error.message, error.status);
  }
};

/** 分页查询用户信息 */
export const getUsersInfoPageController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const result = await getUsersInfoPage(req.query);
    successResponse(res, result, '分页查询用户信息成功');
  } catch (error: any) {
    errorResponse(res, error.message, error.status);
  }
};

/** 获取所有用户信息（全量） */
export const getAllUsersInfoController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const result = await getAllUsersInfo();
    successResponse(res, result, '查询所有用户成功');
  } catch (error: any) {
    errorResponse(res, error.message, error.status);
  }
};

/** 批量更新用户信息 */
export const batchImportUsersInfoController = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await batchImportUsersInfo(req.body);
    successResponse(res, result, '批量更新用户信息成功');
  } catch (error: any) {
    errorResponse(res, error.message, error.status);
  }
};

/** 获取所有用户学院和专业 */
export const getCollegesAndMajorsController = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await getCollegesAndMajors();
    successResponse(res, result, '获取学院和专业成功');
  } catch (error: any) {
    errorResponse(res, error.message, error.status);
  }
};

/** 获取所有管理员信息 */
export const getAllAdminsInfoController = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await getAllAdminsInfo();
    successResponse(res, result, '获取所有管理员信息成功');
  } catch (error: any) {
    errorResponse(res, error.message, error.status);
  }
};