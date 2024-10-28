import { Router } from 'express'
import { registerAuth, loginAuth } from '../controllers/authController'
import { validateRegistration, validateLogin } from '../middlewares/validateInput'
import { sendVerificationCode } from '../controllers/eamilController'

const router = Router()

// 注册路由
router.post('/register', validateRegistration, registerAuth)

// 登录路由
router.post('/login', validateLogin, loginAuth)

// 邮件验证码路由
router.post('/mail', sendVerificationCode)

export default router
