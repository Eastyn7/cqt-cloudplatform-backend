import { successResponse, errorResponse } from '../utils/responseUtil';
import { Request, Response } from 'express';
import * as departmentService from '../services/departmentsService';

// 创建部门
export const createDepartment = async (req: Request, res: Response): Promise<void> => {
  const { name, description } = req.body;
  try {
    const newDepartment = await departmentService.createDepartment(name, description);
    successResponse(res, newDepartment, '部门创建成功', 201);
  } catch (error) {
    errorResponse(res, error instanceof Error ? error.message : '服务器内部错误', 500);
  }
};

// 获取所有部门
export const getDepartments = async (req: Request, res: Response): Promise<void> => {
  try {
    const departments = await departmentService.getDepartments();
    successResponse(res, { departments }, '获取部门成功', 200);
  } catch (error) {
    errorResponse(res, error instanceof Error ? error.message : '服务器内部错误', 500);
  }
};

// 获取单个部门
export const getDepartment = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.body;
  try {
    const department = await departmentService.getDepartment(id);
    successResponse(res, { department }, '获取部门成功', 200);
  } catch (error) {
    errorResponse(res, error instanceof Error ? error.message : '服务器内部错误', 500);
  }
};

// 更新部门
export const updateDepartment = async (req: Request, res: Response): Promise<void> => {
  const { id, updates } = req.body;
  try {
    const result = await departmentService.updateDepartment(id, updates);
    successResponse(res, {}, result, 200);
  } catch (error) {
    errorResponse(res, error instanceof Error ? error.message : '服务器内部错误', 500);
  }
};

// 删除部门
export const deleteDepartment = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.body;
  try {
    const result = await departmentService.deleteDepartment(id);
    successResponse(res, {}, result, 200);
  } catch (error) {
    errorResponse(res, error instanceof Error ? error.message : '服务器内部错误', 500);
  }
};