import cron, { ScheduledTask } from 'node-cron';
import { getTaskConfigByCode, autoCloseExpiredActivities, updateTaskLastRun, createTaskLog, updateUserServiceHours } from '../services/taskService';
import logger from '../utils/logger';
import { formatDateTime } from '../utils/dateUtil';

/**
 * 定时任务调度器
 * 在应用启动时初始化，根据数据库中的任务配置自动执行
 */

interface ScheduledTaskInfo {
  task: ScheduledTask | null;
  taskCode: string;
}

const scheduledTasks: Map<string, ScheduledTaskInfo> = new Map();

/**
 * 执行"自动结束过期活动"任务
 */
const executeAutoCloseActivities = async () => {
  const startTime = new Date();
  let success_flag = false;
  let affected_rows = 0;
  let message = '';

  try {
    affected_rows = await autoCloseExpiredActivities();
    success_flag = true;
    message = `成功更新 ${affected_rows} 条活动状态`;
    logger.info(`[Task] auto_close_activities: ${message}`);
  } catch (err: any) {
    success_flag = false;
    message = err.message || '任务执行失败';
    logger.error(`[Task] auto_close_activities 执行失败: ${message}`);
  }

  // 在活动状态更新后，串行执行“用户服务时长结算”以确保顺序
  if (success_flag) {
    try {
      logger.info('[Task] auto_close_activities -> 开始触发 update_user_service_hours');
      await executeUpdateServiceHours();
    } catch (chainErr: any) {
      logger.error(`[Task] auto_close_activities 后置结算失败: ${chainErr.message}`);
    }
  }

  const endTime = new Date();
  const exec_ms = endTime.getTime() - startTime.getTime();

  // 记录执行日志
  try {
    await createTaskLog({
      task_code: 'auto_close_activities',
      started_at: formatDateTime(startTime),
      finished_at: formatDateTime(endTime),
      success: success_flag ? 1 : 0,
      message,
      affected_rows,
      exec_ms,
    });

    // 更新任务最后执行时间
    await updateTaskLastRun(
      'auto_close_activities',
      formatDateTime(endTime),
      success_flag ? message : `失败: ${message}`
    );
  } catch (logErr: any) {
    logger.error(`[Task] 记录日志失败: ${logErr.message}`);
  }
};

/**
 * 执行"更新用户服务时长"任务
 */
const executeUpdateServiceHours = async () => {
  const startTime = new Date();
  let success_flag = false;
  let affected_rows = 0;
  let message = '';

  try {
    const result = await updateUserServiceHours();
    affected_rows = result.updated_participants;
    success_flag = true;
    message = `成功结算 ${result.updated_participants} 条报名记录（同步用户总时长）`;
    logger.info(`[Task] update_user_service_hours: ${message}`);
  } catch (err: any) {
    success_flag = false;
    message = err.message || '任务执行失败';
    logger.error(`[Task] update_user_service_hours 执行失败: ${message}`);
  }

  const endTime = new Date();
  const exec_ms = endTime.getTime() - startTime.getTime();

  // 记录执行日志
  try {
    await createTaskLog({
      task_code: 'update_user_service_hours',
      started_at: formatDateTime(startTime),
      finished_at: formatDateTime(endTime),
      success: success_flag ? 1 : 0,
      message,
      affected_rows,
      exec_ms,
    });

    // 更新任务最后执行时间
    await updateTaskLastRun(
      'update_user_service_hours',
      formatDateTime(endTime),
      success_flag ? message : `失败: ${message}`
    );
  } catch (logErr: any) {
    logger.error(`[Task] 记录日志失败: ${logErr.message}`);
  }
};

/**
 * 执行特定任务的处理函数
 */
const executeTask = async (taskCode: string) => {
  switch (taskCode) {
    case 'auto_close_activities':
      await executeAutoCloseActivities();
      break;
    case 'update_user_service_hours':
      await executeUpdateServiceHours();
      break;
    default:
      logger.warn(`[Task] 未知任务: ${taskCode}`);
  }
};

/**
 * 为单个任务注册调度器
 */
const registerTask = async (taskCode: string) => {
  try {
    const config = await getTaskConfigByCode(taskCode);

    if (!config) {
      logger.warn(`[Task] 任务配置不存在: ${taskCode}`);
      return;
    }

    // 如果任务已被禁用，则取消调度
    if (!config.enabled) {
      if (scheduledTasks.has(taskCode) && scheduledTasks.get(taskCode)?.task) {
        scheduledTasks.get(taskCode)!.task!.stop();
        logger.info(`[Task] 已停止任务: ${taskCode}`);
      }
      return;
    }

    // 如果已有该任务的调度器，先停止
    if (scheduledTasks.has(taskCode) && scheduledTasks.get(taskCode)?.task) {
      scheduledTasks.get(taskCode)!.task!.stop();
    }

    // 注册新的 cron 任务
    const scheduledTask = cron.schedule(config.cron_expr, async () => {
      logger.debug(`[Task] 执行任务: ${taskCode}`);
      await executeTask(taskCode);
    });

    scheduledTasks.set(taskCode, {
      task: scheduledTask,
      taskCode,
    });

    logger.info(`[Task] 已注册任务: ${taskCode}, cron表达式: ${config.cron_expr}`);
  } catch (err: any) {
    logger.error(`[Task] 注册任务失败 ${taskCode}: ${err.message}`);
  }
};

/**
 * 初始化所有定时任务（在应用启动时调用）
 */
export const initializeScheduler = async () => {
  try {
    logger.info('[Task] 初始化定时任务调度器...');

    // 注册"自动结束过期活动"任务
    await registerTask('auto_close_activities');
    
    // 注册"更新用户服务时长"任务
    await registerTask('update_user_service_hours');

    logger.info('[Task] 定时任务调度器初始化完成');
  } catch (err: any) {
    logger.error(`[Task] 初始化调度器失败: ${err.message}`);
  }
};

/**
 * 刷新单个任务的调度器（当任务配置更新时调用）
 */
export const refreshTaskSchedule = async (taskCode: string) => {
  try {
    logger.info(`[Task] 刷新任务调度: ${taskCode}`);
    await registerTask(taskCode);
  } catch (err: any) {
    logger.error(`[Task] 刷新任务调度失败 ${taskCode}: ${err.message}`);
  }
};

/**
 * 停止所有定时任务（在应用关闭时调用）
 */
export const stopAllSchedulers = () => {
  try {
    logger.info('[Task] 停止所有定时任务...');
    scheduledTasks.forEach(({ task, taskCode }) => {
      if (task) {
        task.stop();
        logger.info(`[Task] 已停止任务: ${taskCode}`);
      }
    });
    scheduledTasks.clear();
    logger.info('[Task] 所有定时任务已停止');
  } catch (err: any) {
    logger.error(`[Task] 停止定时任务失败: ${err.message}`);
  }
};
