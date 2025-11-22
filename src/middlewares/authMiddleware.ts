import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/tokenUtil';
import { errorResponse, HTTP_STATUS } from '../utils/response';

/** 扩展Express Request类型，增加user字段存储用户信息 */
declare module 'express-serve-static-core' {
  interface Request {
    user?: any;
  }
}

// 无需JWT鉴权的路径（公开接口/静态资源等），匹配/api/public|docs|health
const UNPROTECTED_PATH_REGEX = /^\/api\/(public|docs|health)/i;

/** JWT鉴权中间件：提取Bearer Token验证有效性，通过后挂载用户信息到req.user */
export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (UNPROTECTED_PATH_REGEX.test(req.path)) {
    next();
    return;
  }

  const authHeader = req.headers['authorization'];
  const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : undefined;

  if (!token) {
    errorResponse(res, '未提供Token，访问被拒绝', HTTP_STATUS.UNAUTHORIZED);
    return;
  }

  const user = verifyToken(token);
  if (!user) {
    errorResponse(res, '无效或过期的Token，请重新登录', HTTP_STATUS.UNAUTHORIZED);
    return;
  }

  req.user = user;
  next();
};

/** 角色权限控制中间件：仅允许指定角色访问（用法：authorizeRole('admin')） */
export const authorizeRole = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = req.user;

    if (!user) {
      errorResponse(res, '未登录或身份信息丢失', HTTP_STATUS.UNAUTHORIZED);
      return;
    }

    if (!allowedRoles.includes(user.role)) {
      errorResponse(res, '权限不足，无法访问该资源', HTTP_STATUS.FORBIDDEN);
      return;
    }

    next();
  };
};

/** 业务层用户身份二次验证：校验ID与Token匹配性 */
export const authenticateUser = (id: number, token: string): boolean => {
  const user = verifyToken(token);
  if (!user) throw new Error('Token无效或已过期');
  if (user.id !== id) throw new Error('ID与Token不匹配');
  return true;
};