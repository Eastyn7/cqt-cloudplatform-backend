import { Router } from 'express';
import {
  getTaskConfigsController,
  getTaskConfigController,
  updateTaskConfigController,
  runTaskController,
  getTaskLogsController,
} from '../controllers/taskController';
import { authorizeRole } from '../middlewares/authMiddleware';

const taskRouter = Router();

/**
 * 获取所有任务配置（仅管理员）
 * GET /api/tasks/configs
 */
taskRouter.get('/configs', authorizeRole('admin', 'superadmin'), getTaskConfigsController);

/**
 * 根据 task_code 获取任务配置详情（仅管理员）
 * GET /api/tasks/configs/:task_code
 */
taskRouter.get(
  '/configs/:task_code',
  authorizeRole('admin', 'superadmin'),
  getTaskConfigController
);

/**
 * 更新任务配置（仅管理员）
 * PATCH /api/tasks/configs/:task_code
 * body: { enabled?, cron_expr?, remark? }
 */
taskRouter.patch(
  '/configs/:task_code',
  authorizeRole('admin', 'superadmin'),
  updateTaskConfigController
);

/**
 * 获取任务执行日志（仅管理员）
 * GET /api/tasks/logs
 * query: { page?, pageSize?, task_code?, task_name? }
 */
taskRouter.get(
  '/logs',
  authorizeRole('admin', 'superadmin'),
  getTaskLogsController
);

/**
 * 手动执行任务一次（仅管理员）
 * POST /api/tasks/:task_code/run
 */
taskRouter.post(
  '/:task_code/run',
  authorizeRole('admin', 'superadmin'),
  runTaskController
);

export default taskRouter;
