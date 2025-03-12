import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { errorHandler } from './middlewares/errorHandler';
import { authenticateToken } from './middlewares/authenticationMiddleware';
import router from './routers/index';
import { checkDatabaseConnection } from './db';

// 加载 .env 配置
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3302;
const NODE_ENV = process.env.NODE_ENV || 'development';

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// 全局使用 tokenMiddleware
app.use(authenticateToken);

// 路由
app.use('/api', router);

// 错误处理中间件
app.use(errorHandler);

/**
 * 启动服务器
 */
const startServer = async () => {
  try {
    // 先检查数据库连接
    await checkDatabaseConnection();

    // 启动服务器
    app.listen(PORT, () => {
      console.log(`🚀 API 服务器运行在 http://127.0.0.1:${PORT}`);
      console.log(`📅 启动时间: ${new Date().toLocaleString()}`);
      console.log(`📡 环境: ${NODE_ENV || 'development'}`);
    });
  } catch (err: any) {
    console.error('❌ 服务器启动失败:', err.message);
    process.exit(1); // 发生错误时退出进程
  }
};

// 运行服务器
startServer();
