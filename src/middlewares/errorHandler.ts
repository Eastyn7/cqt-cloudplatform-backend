import { Request, Response, NextFunction } from 'express';
import { errorResponse, HTTP_STATUS } from '../utils/response';

/** 全局错误处理中间件：捕获所有未处理异常，返回统一格式响应（开发环境附带堆栈） */
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('🚨 [全局错误捕获]', {
    method: req.method,
    path: req.originalUrl,
    message: err.message,
  });

  const statusCode = err.statusCode || HTTP_STATUS.INTERNAL_ERROR;
  const message = err.message || '服务器内部错误，请稍后再试。';
  const debugInfo = process.env.NODE_ENV === 'development' ? err.stack : undefined;

  errorResponse(res, message, statusCode, debugInfo);
};

/** 404路由处理中间件：捕获未命中路由（需放在所有路由之后） */
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.warn(`⚠️ 路由未找到: ${req.method} ${req.originalUrl}`);
  errorResponse(res, `接口未找到：${req.originalUrl}`, HTTP_STATUS.NOT_FOUND);
};