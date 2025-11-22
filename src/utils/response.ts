// 封装统一接口响应格式，支持状态码、分页、调试信息等
import { Response } from 'express';

/** 统一接口响应结构 */
export interface ApiResponse<T = any> {
  code: number;        // HTTP状态码
  success: boolean;    // 是否成功
  message: string;     // 提示信息
  data?: T;            // 返回数据
  meta?: any;          // 元信息（分页、统计等）
  debug?: any;         // 调试信息（仅开发模式）
}

/** 成功响应（默认200状态码） */
export const successResponse = <T>(
  res: Response,
  data?: T,
  message = 'Success',
  code = 200,
  meta?: any
): Response<ApiResponse<T>> => {
  const response: ApiResponse<T> = {
    code,
    success: true,
    message,
    ...(data ? { data } : {}),
    ...(meta ? { meta } : {}),
  };
  return res.status(code).json(response);
};

/** 失败响应（默认500状态码，开发环境可显示调试信息） */
export const errorResponse = (
  res: Response,
  message = 'Internal Server Error',
  code = 500,
  debug?: any
): Response<ApiResponse> => {
  const response: ApiResponse = {
    code,
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && debug ? { debug } : {}),
  };
  return res.status(code).json(response);
};

/** 通用响应（支持自定义状态码：400/401/403/404/201等） */
export const sendResponse = (
  res: Response,
  code: number,
  message: string,
  data?: any
): Response<ApiResponse> => {
  return res.status(code).json({
    code,
    success: code >= 200 && code < 300,
    message,
    ...(data ? { data } : {}),
  });
};

/** 常用HTTP状态码枚举（统一管理） */
export const HTTP_STATUS = {
  OK: 200,                  // 请求成功
  CREATED: 201,             // 创建成功
  ACCEPTED: 202,            // 已接受（异步处理中）
  NO_CONTENT: 204,          // 请求成功但无返回内容
  BAD_REQUEST: 400,         // 请求参数错误
  UNAUTHORIZED: 401,        // 未授权（Token无效）
  FORBIDDEN: 403,           // 无权限访问
  NOT_FOUND: 404,           // 资源不存在
  METHOD_NOT_ALLOWED: 405,  // 请求方法不允许
  CONFLICT: 409,            // 资源冲突
  INTERNAL_ERROR: 500,      // 服务器内部错误
  NOT_IMPLEMENTED: 501,     // 功能未实现
  SERVICE_UNAVAILABLE: 503, // 服务暂时不可用
};