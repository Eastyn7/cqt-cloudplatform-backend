import { Router } from 'express'
import publicRoutes from './publicRouter'
import authRoutes from './authRouter'

const router = Router()

router.use('/public', publicRoutes) // 开放API
router.use('/auth', authRoutes) // 用户相关的API

export default router;
