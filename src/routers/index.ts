import { Router } from 'express'
import publicRoutes from './publicRouter'
import authRoutes from './authRouter'
import backboneRoutes from './backboneMembersRouter'
import departmentsRoutes from './departmentsRouter'
import umbrellaRoutes from './umbrellaRouter'

const router = Router()

router.use('/public', publicRoutes) // 开放API
router.use('/auth', authRoutes) // 用户相关的API
router.use('/backbone', backboneRoutes) // 骨干成员相关的API
router.use('/departments', departmentsRoutes) // 部门相关的API
router.use('/umbrella', umbrellaRoutes) // 爱心雨伞相关的API

export default router;
