import { Router } from 'express';
import { registerUser, loginUser } from '../controllers/authController';
import { validateRegistration, validateLogin } from '../middlewares/validateInput';

const router = Router();

// 注册路由
router.post('/register', validateRegistration, registerUser);

// 登录路由
router.post('/login', validateLogin, loginUser);

export default router;
