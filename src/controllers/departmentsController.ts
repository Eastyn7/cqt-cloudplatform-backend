import { Request, Response } from 'express';
import {
  createDepartment,
  getDepartmentsPage,
  getAllDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
  batchCreateDepartments
} from '../services/departmentsService';
import { successResponse, errorResponse, HTTP_STATUS } from '../utils/response';

/** 创建部门 */
export const createDepartmentController = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await createDepartment(req.body);
    successResponse(res, result, '部门创建成功');
  } catch (error: any) {
    errorResponse(res, error.message, error.status);
  }
};

/** 分页查询部门 */
export const getDepartmentsPageController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const result = await getDepartmentsPage(req.query);
    successResponse(res, result, '分页查询部门成功');
  } catch (error: any) {
    errorResponse(res, error.message, error.status);
  }
};

/** 获取所有部门 */
export const getAllDepartmentsController = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await getAllDepartments();
    successResponse(res, result, '查询所有部门成功');
  } catch (error: any) {
    errorResponse(res, error.message, error.status);
  }
};

/** 获取单个部门信息 */
export const getDepartmentByIdController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { dept_id } = req.params;
    const result = await getDepartmentById(Number(dept_id));
    successResponse(res, result, '查询部门信息成功');
  } catch (error: any) {
    errorResponse(res, error.message, error.status);
  }
};

/** 更新部门信息 */
export const updateDepartmentController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { dept_id } = req.params;
    const result = await updateDepartment(Number(dept_id), req.body);
    successResponse(res, result, '部门信息更新成功');
  } catch (error: any) {
    errorResponse(res, error.message, error.status);
  }
};

/** 删除部门 */
export const deleteDepartmentController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { dept_id } = req.params;
    const result = await deleteDepartment(Number(dept_id));
    successResponse(res, result, '部门删除成功');
  } catch (error: any) {
    errorResponse(res, error.message, error.status);
  }
};

/** 批量创建部门 */
export const batchCreateDepartmentsController = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await batchCreateDepartments(req.body);
    successResponse(res, result, '批量创建部门成功');
  } catch (error: any) {
    errorResponse(res, error.message, error.status);
  }
};