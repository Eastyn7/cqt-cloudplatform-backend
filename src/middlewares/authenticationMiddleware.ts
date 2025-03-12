import { Request, Response, NextFunction } from 'express'
import { errorResponse } from '../utils/responseUtil'
import { verifyToken } from '../utils/jwtUtils' // 引入封装的 JWT 验证方法

// 允许跳过 JWT 认证的路由
const UNPROTECTED_PATH_REGEX = /^\/api\/public/

/**
 * JWT 验证中间件
 */
export const authenticateToken = (req: Request, res: Response, next: NextFunction): any => {
  // 允许跳过验证的路径
  if (UNPROTECTED_PATH_REGEX.test(req.path)) {
    return next()
  }

  // 从请求头获取 Authorization
  const authHeader = req.headers['authorization']
  const token = authHeader?.split(' ')[1] // 提取 Bearer token

  if (!token) {
    return errorResponse(res, '没有提供 Token，访问被拒绝', 401)
  }

  // 验证 token
  const user = verifyToken(token)
  if (!user) {
    return errorResponse(res, 'Token 无效', 403)
  }

  // 将解码后的用户信息存入 request 对象中
  req.body.user = user

  // 获取用户请求体中的 id
  const { id: requestAuthId } = req.body
  const { id: analysisId } = user

  // 比较解码出的 id 与请求中的 id 是否一致
  if (analysisId !== requestAuthId) {
    return errorResponse(res, 'id 与 token 不匹配', 403)
  }

  next() // 继续执行后续中间件或路由
}

/**
 * JWT 用户验证
 * 适合特殊情况验证
 */
export const authenticateUser = (id: number, token: string): boolean => {
  // 验证 token 并解析
  const user = verifyToken(token)

  if (!user) {
    throw new Error('token 无效')
  }

  const analysisId = user.id

  if (analysisId !== id) {
    throw new Error('id 与 token 不匹配')
  }

  return true // 如果验证通过，返回 true
}

/**
 * 权限控制中间件
 * @param allowedRoles 允许访问该接口的角色列表
 */
export const authorizeRole = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = req.body.user // 需要 `authenticateToken` 先执行，才能获取 `user`

    if (!user || !allowedRoles.includes(user.role)) {
      return errorResponse(res, '没有权限！', 403)
    }

    next() // 继续执行后续中间件或路由
  }
}