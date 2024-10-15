import express from 'express';
import cors from 'cors';
import { errorHandler } from './middlewares/errorHandler';
import router from './routers/index';

const app = express();

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// 路由
app.use('/api', router);

// 错误处理中间件
app.use(errorHandler);

// 启动服务器
app.listen(3007, () => {
  console.log('API server running at http://127.0.0.1:3007');
});
