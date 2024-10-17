import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

const UNPROTECTED_PATH_REGEX = /^\/api\/public/; // 匹配所有以 /api/public 开头的路径

// 中间件：验证 JWT token
export const authenticateToken = (req: Request, res: Response, next: NextFunction): any => {
  // 使用正则表达式检查路径是否需要跳过验证
  if (UNPROTECTED_PATH_REGEX.test(req.path)) {
    return next(); // 如果路径不需要验证，直接跳过中间件
  }

  const authHeader = req.headers['authorization']; // 从请求头中获取 Authorization
  const token = authHeader && authHeader.split(' ')[1]; // Bearer token 格式

  if (!token) {
    return res.status(401).json({ message: '没有提供 token，访问被拒绝' });
  }

  // 验证 token 并解析
  jwt.verify(token, 'CTBU CTQ', (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'token 无效' });
    }

    // 将解码后的用户信息存入 request 对象中
    req.body.user = user;

    // 获取用户请求体中的 auth_id
    const { auth_id: requestAuthId } = req.body;
    const { auth_id: analysisId } = req.body.user;

    // 比较解码出的 auth_id 与请求中的 auth_id 是否一致
    if (analysisId !== requestAuthId) {
      return res.status(403).json({ message: 'auth_id 与 token 不匹配' });
    }

    next(); // 如果验证通过，继续执行下一个中间件或路由处理
  });
};
