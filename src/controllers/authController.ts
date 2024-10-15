import { successResponse, errorResponse } from '../utils/responseUtil';
import { Request, Response } from 'express';
import * as authService from '../services/authService';

export const registerUser = async (req: Request, res: Response): Promise<void> => {
  const { student_id, email, password } = req.body;

  try {
    // 调用服务层注册用户逻辑
    const newUser = await authService.registerUser(student_id, email, password);
    successResponse(res, newUser, '用户注册成功', 201);
  } catch (error) {
    if (error instanceof Error) {
      errorResponse(res, error.message, 400);
    } else {
      errorResponse(res, "服务器内部错误", 500);
    }
  }
};

export const loginUser = async (req: Request, res: Response): Promise<void> => {
  const { loginInput, password } = req.body;

  try {
    // 调用服务层登录逻辑
    const token = await authService.loginUser(loginInput, password);
    successResponse(res, { token }, '登录成功', 200);

  } catch (error) {
    if (error instanceof Error) {
      errorResponse(res, error.message, 400);
    } else {
      errorResponse(res, "服务器内部错误", 500);
    }
  }
};
