import { successResponse, errorResponse } from '../utils/responseUtil'
import { Request, Response } from 'express'
import * as authService from '../services/authService'
import { verifyCode } from './eamilController'

// 注册
export const registerAuth = async (req: Request, res: Response): Promise<void> => {
  const { username, student_id, email, password, verificationCode } = req.body

  try {
    // 验证验证码
    const isCodeValid = verifyCode(email, verificationCode)
    if (!isCodeValid) {
      return errorResponse(res, '验证码错误或已过期', 400)
    }
    // 验证成功则调用服务层注册用户逻辑
    const newAuth = await authService.registerAuth(username, student_id, email, password)
    successResponse(res, newAuth, '用户注册成功', 201)
  } catch (error) {
    if (error instanceof Error) {
      errorResponse(res, error.message, 400)
    } else {
      errorResponse(res, "服务器内部错误", 500)
    }
  }
}

// 登录
export const loginAuth = async (req: Request, res: Response): Promise<void> => {
  const { loginInput, password } = req.body

  try {
    // 调用服务层登录逻辑
    const auth = await authService.loginAuth(loginInput, password)
    successResponse(res, { auth }, '登录成功', 200)

  } catch (error) {
    if (error instanceof Error) {
      errorResponse(res, error.message, 400)
    } else {
      errorResponse(res, "服务器内部错误", 500)
    }
  }
}

// 获取用户信息
export const getAuthInfo = async (req: Request, res: Response): Promise<void> => {
  const { auth_id } = req.body

  try {
    const authInfo = await authService.getAuthInfo(auth_id)
    successResponse(res, { authInfo }, '获取信息成功', 200)

  } catch (error) {
    if (error instanceof Error) {
      errorResponse(res, error.message, 400)
    } else {
      errorResponse(res, "服务器内部错误", 500)
    }
  }
}

// 更新用户信息
export const updateUserInfo = async (req: Request, res: Response): Promise<void> => {
  const { auth_id, updates } = req.body

  try {
    const result = await authService.updateUserInfo(auth_id, updates)
    successResponse(res, {}, result, 200)
  } catch (error) {
    if (error instanceof Error) {
      errorResponse(res, error.message, 400)
    } else {
      errorResponse(res, "服务器内部错误", 500)
    }
  }
}

// 修改密码
export const modifyPassword = async (req: Request, res: Response): Promise<void> => {
  const { auth_id, email, verificationCode, oldPassword, newPassword } = req.body

  try {
    // 验证验证码
    const isCodeValid = verifyCode(email, verificationCode)
    if (!isCodeValid) {
      return errorResponse(res, '验证码错误或已过期', 400)
    }
    // 验证新旧密码是否一致
    if (newPassword === oldPassword) {
      return errorResponse(res, '新旧密码不能一致', 400)
    }
    // 验证成功则调用服务层修改密码逻辑
    const result = await authService.modifyPassword(auth_id, email, oldPassword, newPassword)
    successResponse(res, {}, result, 200)
  } catch (error) {
    if (error instanceof Error) {
      errorResponse(res, error.message, 400)
    } else {
      errorResponse(res, "服务器内部错误", 500)
    }
  }
}