import { successResponse, errorResponse } from '../utils/responseUtil';
import { Request, Response } from 'express';
import * as authService from '../services/authService';

export const registerAuth = async (req: Request, res: Response): Promise<void> => {
  const { student_id, email, password } = req.body;

  try {
    // 调用服务层注册用户逻辑
    const newAuth = await authService.registerAuth(student_id, email, password);
    successResponse(res, newAuth, '用户注册成功', 201);
  } catch (error) {
    if (error instanceof Error) {
      errorResponse(res, error.message, 400);
    } else {
      errorResponse(res, "服务器内部错误", 500);
    }
  }
};

export const loginAuth = async (req: Request, res: Response): Promise<void> => {
  const { loginInput, password } = req.body;

  try {
    // 调用服务层登录逻辑
    const token = await authService.loginAuth(loginInput, password);
    successResponse(res, { token }, '登录成功', 200);

  } catch (error) {
    if (error instanceof Error) {
      errorResponse(res, error.message, 400);
    } else {
      errorResponse(res, "服务器内部错误", 500);
    }
  }
};

export const getAuthInfo = async (req: Request, res: Response): Promise<void> => {
  const { auth_id } = req.body;
  
  try {
    // 调用服务层登录逻辑
    const authInfo = await authService.getAuthInfo(auth_id);
    successResponse(res, { authInfo }, '获取信息成功', 200);

  } catch (error) {
    if (error instanceof Error) {
      errorResponse(res, error.message, 400);
    } else {
      errorResponse(res, "服务器内部错误", 500);
    }
  }
}
