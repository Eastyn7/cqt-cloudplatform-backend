import { Request, Response } from 'express';
import { registerUser, loginUser, batchRegisterUsers, deleteUserByStudentId, batchDeleteUsers, changePassword, getAllAdminsPage, getAllAdmins, setAdmin, removeAdmin, searchUsers, batchSetUserRoles } from '../../services/auth/authLoginService';
import { successResponse, errorResponse } from '../../utils/response';

/** 注册接口控制器 */
export const registerController = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await registerUser(req.body);
    successResponse(res, result, '注册成功');
  } catch (error: any) {
    errorResponse(res, error.message, error.status);
  }
};

/** 登录接口控制器 */
export const loginController = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await loginUser(req.body);
    successResponse(res, result, '登录成功');
  } catch (error: any) {
    errorResponse(res, error.message, error.status);
  }
};

/** 批量注册接口控制器（管理员专用） */
export const batchRegisterController = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await batchRegisterUsers(req.body);
    successResponse(res, result, '批量注册成功');
  } catch (error: any) {
    errorResponse(res, error.message, error.status);
  }
};

/** 单个用户删除控制器（按学号） */
export const deleteUserController = async (req: Request, res: Response) => {
  try {
    const { student_id } = req.params;
    const result = await deleteUserByStudentId(student_id);
    successResponse(res, result, '用户删除成功');
  } catch (error: any) {
    errorResponse(res, error.message, error.status);
  }
};

/** 批量删除用户控制器（传入学号数组） */
export const batchDeleteUsersController = async (req: Request, res: Response) => {
  try {
    const studentIds = req.body.studentIds;
    const result = await batchDeleteUsers(studentIds);
    successResponse(res, result, '批量删除完成');
  } catch (error: any) {
    errorResponse(res, error.message, error.status);
  }
};

/** 修改密码接口控制器 */
export const changePasswordController = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await changePassword(req.body);
    successResponse(res, result, '密码修改成功');
  } catch (error: any) {
    errorResponse(res, error.message, error.status);
  }
};

/** 获取所有管理员控制器（分页） */
export const getAllAdminsPageController = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await getAllAdminsPage(req.query);
    successResponse(res, result, '获取管理员列表成功');
  } catch (error: any) {
    errorResponse(res, error.message, error.status);
  }
};

/** 获取所有管理员控制器（全量） */
export const getAllAdminsController = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await getAllAdmins();
    successResponse(res, result, '获取所有管理员成功');
  } catch (error: any) {
    errorResponse(res, error.message, error.status);
  }
};

/** 设置管理员控制器 */
export const setAdminController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { student_id } = req.body;
    const result = await setAdmin(student_id);
    successResponse(res, result, '设置管理员成功');
  } catch (error: any) {
    errorResponse(res, error.message, error.status);
  }
};

/** 取消管理员身份控制器 */
export const removeAdminController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { student_id } = req.body;
    const result = await removeAdmin(student_id);
    successResponse(res, result, '取消管理员成功');
  } catch (error: any) {
    errorResponse(res, error.message, error.status);
  }
};

/** 批量设置用户角色控制器 */
export const batchSetUserRolesController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userRoles } = req.body;
    const result = await batchSetUserRoles(userRoles);
    successResponse(res, result, '批量设置用户角色成功');
  } catch (error: any) {
    errorResponse(res, error.message, error.status);
  }
};

/** 搜索用户控制器 */
export const searchUsersController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { q } = req.query as { q: string };
    const result = await searchUsers(q);
    successResponse(res, result, '搜索用户成功');
  } catch (error: any) {
    errorResponse(res, error.message, error.status);
  }
};