import { Router } from 'express'
import { getAuthInfo, modifyPassword, updateUserInfo } from '../controllers/authController'

const router = Router()

// 获取用户信息
router.post('/getauthinfo', getAuthInfo)

// 更新用户信息
router.put('/updateauthinfo', updateUserInfo)

// 修改密码
router.put('/modifypassword', modifyPassword)

export default router
