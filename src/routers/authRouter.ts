import { Router } from 'express'
import { registerAuthNoCode, getAuthInfo, modifyPassword, updateUserInfo } from '../controllers/authController'
import { validateRegistration } from '../middlewares/validateInput'

const router = Router()

// 批量注册(试用于管理员，不用收取他们的邮箱验证码)
router.post('/registernocode', validateRegistration, registerAuthNoCode)

// 获取用户信息
router.post('/getauthinfo', getAuthInfo)

// 更新用户信息
router.put('/updateauthinfo', updateUserInfo)

// 修改密码
router.put('/modifypassword', modifyPassword)

export default router
