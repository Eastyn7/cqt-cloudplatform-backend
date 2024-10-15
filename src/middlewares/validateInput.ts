import { errorResponse } from '../utils/responseUtil';
import { Request, Response, NextFunction } from 'express';

const studentIdRegex = /^\d{10}$/;
const emailRegex = /^[a-zA-Z0-9._%+-]+@ctbu\.edu\.cn$/;

// 验证注册请求
export const validateRegistration = (req: Request, res: Response, next: NextFunction): void => {
  const { student_id, email, password } = req.body;

  if (!student_id || !studentIdRegex.test(student_id)) {
    return errorResponse(res, '学号必须为10位数字', 400);
  }

  if (!email || !emailRegex.test(email)) {
    return errorResponse(res, '邮箱必须以 @ctbu.edu.cn 结尾', 400);
  }

  if (!password || password.length < 6 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)) {
    return errorResponse(res, '密码长度至少为6位，并且包含大小写字母和数字', 400);
  }

  // 验证通过，调用 next()
  next();
};

// 验证登录请求
export const validateLogin = (req: Request, res: Response, next: NextFunction): void => {
  const { loginInput, password } = req.body;

  if (!loginInput || (!studentIdRegex.test(loginInput) && !emailRegex.test(loginInput))) {
    return errorResponse(res, '学号或邮箱格式错误', 400);
  }

  if (!password) {
    return errorResponse(res, '密码不能为空', 400);
  }

  // 验证通过，调用 next()
  next();
};
