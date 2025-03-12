import { Router } from 'express'
import publicRoutes from './publicRouter'
import authRoutes from './authRouter'
import backboneRoutes from './backboneMembersRouter'
import departmentsRoutes from './departmentsRouter'

const router = Router()

router.use('/public', publicRoutes) // 开放API
router.use('/auth', authRoutes) // 用户相关的API
router.use('/backbone', backboneRoutes) // 骨干成员相关的API
router.use('/departments', departmentsRoutes) // 骨干成员相关的API

export default router;
