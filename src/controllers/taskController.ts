import { Request, Response } from 'express';
import { successResponse, errorResponse, HTTP_STATUS } from '../utils/response';
import { formatDateTime } from '../utils/dateUtil';
import {
  getAllTaskConfigs,
  getTaskConfigByCode,
  updateTaskConfig,
  getTaskLogs,
  autoCloseExpiredActivities,
  updateUserServiceHours,
  updateTaskLastRun,
  createTaskLog,
} from '../services/taskService';

/**
 * 获取所有任务配置（分页）
 */
export const getTaskConfigsController = async (req: Request, res: Response) => {
  try {
    const { page = '1', pageSize = '10' } = req.query;

    const result = await getAllTaskConfigs({
      page: parseInt(page as string),
      pageSize: parseInt(pageSize as string),
    });

    successResponse(res, result, '获取任务配置成功');
  } catch (err: any) {
    errorResponse(res, err.message || '获取任务配置失败', err.status || HTTP_STATUS.INTERNAL_ERROR);
  }
};

/**
 * 根据 task_code 获取任务配置详情
 */
export const getTaskConfigController = async (req: Request, res: Response) => {
  try {
    const { task_code } = req.params;

    if (!task_code) {
      return errorResponse(res, '任务代码不能为空', HTTP_STATUS.BAD_REQUEST);
    }

    const config = await getTaskConfigByCode(task_code);
    if (!config) {
      return errorResponse(res, '任务配置不存在', HTTP_STATUS.NOT_FOUND);
    }

    successResponse(res, config, '获取任务配置成功');
  } catch (err: any) {
    errorResponse(res, err.message || '获取任务配置失败', err.status || HTTP_STATUS.INTERNAL_ERROR);
  }
};

/**
 * 更新任务配置（enabled, cron_expr, remark）
 */
export const updateTaskConfigController = async (req: Request, res: Response) => {
  try {
    const { task_code } = req.params;
    const { enabled, cron_expr, remark } = req.body;

    if (!task_code) {
      return errorResponse(res, '任务代码不能为空', HTTP_STATUS.BAD_REQUEST);
    }

    // 验证 task_code 存在
    const config = await getTaskConfigByCode(task_code);
    if (!config) {
      return errorResponse(res, '任务配置不存在', HTTP_STATUS.NOT_FOUND);
    }

    // 构建更新对象
    const updates: any = {};
    if (enabled !== undefined) updates.enabled = enabled ? 1 : 0;
    if (cron_expr !== undefined) updates.cron_expr = cron_expr;
    if (remark !== undefined) updates.remark = remark;

    if (Object.keys(updates).length === 0) {
      return errorResponse(res, '没有可更新的字段', HTTP_STATUS.BAD_REQUEST);
    }

    const updated = await updateTaskConfig(task_code, updates);
    if (!updated) {
      return errorResponse(res, '更新任务配置失败', HTTP_STATUS.INTERNAL_ERROR);
    }

    // 返回更新后的配置
    const updatedConfig = await getTaskConfigByCode(task_code);
    successResponse(res, updatedConfig, '更新任务配置成功');
  } catch (err: any) {
    errorResponse(res, err.message || '更新任务配置失败', err.status || HTTP_STATUS.INTERNAL_ERROR);
  }
};

/**
 * 手动触发一次任务执行
 */
export const runTaskController = async (req: Request, res: Response) => {
  try {
    const { task_code } = req.params;

    if (!task_code) {
      return errorResponse(res, '任务代码不能为空', HTTP_STATUS.BAD_REQUEST);
    }

    // 验证 task_code 存在
    const config = await getTaskConfigByCode(task_code);
    if (!config) {
      return errorResponse(res, '任务配置不存在', HTTP_STATUS.NOT_FOUND);
    }

    const startTime = new Date();
    let success_flag = false;
    let affected_rows = 0;
    let message = '';

    try {
      // 支持不同的任务类型
      if (task_code === 'auto_close_activities') {
        affected_rows = await autoCloseExpiredActivities();
        success_flag = true;
        message = `成功更新 ${affected_rows} 条活动状态`;
      } else if (task_code === 'update_user_service_hours') {
        const result = await updateUserServiceHours();
        affected_rows = result.updated_participants;
        success_flag = true;
        message = `成功结算 ${result.updated_participants} 条报名记录（同步用户总时长）`;
      } else {
        message = '不支持的任务类型';
      }
    } catch (taskErr: any) {
      success_flag = false;
      message = taskErr.message || '任务执行失败';
    }

    const endTime = new Date();
    const exec_ms = endTime.getTime() - startTime.getTime();

    // 记录日志
    await createTaskLog({
      task_code,
      started_at: formatDateTime(startTime),
      finished_at: formatDateTime(endTime),
      success: success_flag ? 1 : 0,
      message,
      affected_rows,
      exec_ms,
    });

    // 更新任务配置的最后执行时间和结果
    await updateTaskLastRun(
      task_code,
      formatDateTime(endTime),
      success_flag ? message : `失败: ${message}`
    );

    if (!success_flag) {
      return errorResponse(res, message, HTTP_STATUS.INTERNAL_ERROR);
    }

    successResponse(res, {
      task_code,
      success: true,
      affected_rows,
      message,
      ran_at: endTime.toISOString(),
      exec_ms,
    }, '任务执行成功');
  } catch (err: any) {
    errorResponse(res, err.message || '执行任务失败', err.status || HTTP_STATUS.INTERNAL_ERROR);
  }
};

/**
 * 获取任务执行日志（分页 + 筛选）
 */
export const getTaskLogsController = async (req: Request, res: Response) => {
  try {
    const { page = '1', pageSize = '10', task_code, task_name } = req.query;

    const result = await getTaskLogs(
      {
        page: parseInt(page as string),
        pageSize: parseInt(pageSize as string),
      },
      {
        task_code: task_code as string,
        task_name: task_name as string,
      }
    );

    successResponse(res, result, '获取任务日志成功');
  } catch (err: any) {
    errorResponse(res, err.message || '获取任务日志失败', err.status || HTTP_STATUS.INTERNAL_ERROR);
  }
};
