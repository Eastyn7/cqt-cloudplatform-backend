import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool, { checkDatabaseConnection } from './db';
import { logMiddleware } from './middlewares/logMiddleware';
import { authenticateToken } from './middlewares/authMiddleware';
import { notFoundHandler, errorHandler } from './middlewares/errorHandler';
import router from './routers/index';

// 加载环境变量配置
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3302;
const NODE_ENV = process.env.NODE_ENV || 'development';
const allowedOrigins = process.env.CORS_ORIGINS?.split(',').map(origin => origin.trim()) || ['*'];

// 通用中间件配置
// CORS跨域：支持多域名白名单，开发环境允许所有来源
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // 无Origin请求（如Postman）直接放行
    if (NODE_ENV === 'development' || allowedOrigins.includes('*')) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);

    console.warn(`🚫 拒绝跨域请求来源：${origin}`);
    return callback(new Error(`不允许的跨域来源：${origin}`));
  },
  credentials: true // 允许携带Cookie、Token
}));
app.use(express.json()); // 解析JSON请求体
app.use(express.urlencoded({ extended: false })); // 解析表单请求体

// 日志中间件：记录请求耗时、IP、用户信息等
app.use(logMiddleware);

// 路由配置
app.use(authenticateToken); // 所有接口统一经过Token验证（白名单逻辑内部处理）
app.use('/api', router); // 注册所有业务路由

// 错误处理中间件
app.use(notFoundHandler); // 捕获未命中路由（404）
app.use(errorHandler); // 全局错误统一处理

/** 启动服务器 */
const startServer = async () => {
  try {
    await checkDatabaseConnection(); // 检查数据库连接

    app.listen(PORT, () => {
      console.log(`🚀 API 服务器运行在 http://127.0.0.1:${PORT}`);
      console.log(`📅 启动时间: ${new Date().toLocaleString()}`);
      console.log(`📡 环境: ${NODE_ENV}`);
      console.log(`🗄️ 数据库: ${process.env.DB_NAME}@${process.env.DB_HOST}`);
    });
  } catch (err: any) {
    console.error('❌ 服务器启动失败:', err.message);
    process.exit(1);
  }
};

// 启动服务
startServer();

// 优雅关闭：处理Ctrl+C信号，关闭数据库连接池
process.on('SIGINT', async () => {
  console.log('\n🛑 正在关闭服务器...');
  await pool.end();
  console.log('✅ 数据库连接池已关闭');
  process.exit(0);
});