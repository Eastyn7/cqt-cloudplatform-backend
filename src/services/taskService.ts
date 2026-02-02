import { query } from '../db';
import { HTTP_STATUS } from '../utils/response';
import {
  TaskConfigRecord,
  TaskConfigWritable,
  TaskLogRecord,
  TaskLogWritable,
  TaskExecutionResult,
} from '../types/taskTypes';
import { PaginationQuery } from '../types/requestTypes';
import { settleEndedActivitiesServiceHours } from './activityParticipantsService';

/**
 * 获取所有任务配置（分页）
 */
export const getAllTaskConfigs = async (
  pagination: PaginationQuery
): Promise<{ list: TaskConfigRecord[]; pagination: { page: number; pageSize: number; total: number } }> => {
  const { page = 1, pageSize = 10 } = pagination;
  const pageNum = typeof page === 'string' ? parseInt(page) : page;
  const sizeNum = typeof pageSize === 'string' ? parseInt(pageSize) : pageSize;
  const offset = (pageNum - 1) * sizeNum;

  const countSql = `SELECT COUNT(*) as total FROM task_config`;
  const countResult = await query<{ total: number }[]>(countSql);
  const total = countResult[0]?.total || 0;

  const sql = `
    SELECT * FROM task_config
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `;
  const list = await query<TaskConfigRecord[]>(sql, [sizeNum, offset]);

  return {
    list,
    pagination: {
      page: pageNum,
      pageSize: sizeNum,
      total,
    },
  };
};

/**
 * 根据 task_code 获取任务配置
 */
export const getTaskConfigByCode = async (
  task_code: string
): Promise<TaskConfigRecord | null> => {
  const sql = `
    SELECT * FROM task_config
    WHERE task_code = ?
  `;
  const results = await query<TaskConfigRecord[]>(sql, [task_code]);
  return results.length > 0 ? results[0] : null;
};

/**
 * 更新任务配置（enabled, cron_expr, remark）
 */
export const updateTaskConfig = async (
  task_code: string,
  updates: Partial<Pick<TaskConfigRecord, 'enabled' | 'cron_expr' | 'remark'>>
): Promise<boolean> => {
  if (!task_code) {
    throw { status: HTTP_STATUS.BAD_REQUEST, message: '任务代码不能为空' };
  }

  const fields = Object.keys(updates).filter(
    (key) => updates[key as keyof typeof updates] !== undefined
  );

  if (fields.length === 0) {
    throw { status: HTTP_STATUS.BAD_REQUEST, message: '没有可更新的字段' };
  }

  const setClause = fields.map((field) => `${field} = ?`).join(', ');
  const sql = `
    UPDATE task_config
    SET ${setClause}, updated_at = NOW()
    WHERE task_code = ?
  `;
  const values = [...fields.map((field) => updates[field as keyof typeof updates]), task_code];

  const result = await query<{ affectedRows: number }>(sql, values);
  return result.affectedRows > 0;
};

/**
 * 更新任务最后执行时间和结果
 */
export const updateTaskLastRun = async (
  task_code: string,
  lastRunAt: string,
  lastResult: string
): Promise<boolean> => {
  const sql = `
    UPDATE task_config
    SET last_run_at = ?, last_result = ?, updated_at = NOW()
    WHERE task_code = ?
  `;
  const result = await query<{ affectedRows: number }>(sql, [lastRunAt, lastResult, task_code]);
  return result.affectedRows > 0;
};

/**
 * 记录任务执行日志
 */
export const createTaskLog = async (log: TaskLogWritable): Promise<number> => {
  const sql = `
    INSERT INTO task_logs (task_code, started_at, finished_at, success, message, affected_rows, exec_ms)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  const values = [
    log.task_code,
    log.started_at,
    log.finished_at,
    log.success,
    log.message,
    log.affected_rows,
    log.exec_ms,
  ];
  const result = await query<{ insertId: number }>(sql, values);
  return result.insertId;
};

/**
 * 获取任务执行日志（分页 + 筛选）
 */
export const getTaskLogs = async (
  pagination: PaginationQuery,
  filters?: { task_code?: string; task_name?: string }
): Promise<{ list: (TaskLogRecord & { task_name: string })[]; pagination: { page: number; pageSize: number; total: number } }> => {
  const { page = 1, pageSize = 10 } = pagination;
  const pageNum = typeof page === 'string' ? parseInt(page) : page;
  const sizeNum = typeof pageSize === 'string' ? parseInt(pageSize) : pageSize;
  const offset = (pageNum - 1) * sizeNum;

  const conditions: string[] = [];
  const values: any[] = [];

  // 添加 task_code 筛选（可选）
  if (filters?.task_code) {
    conditions.push('tl.task_code = ?');
    values.push(filters.task_code);
  }

  // 添加 task_name 筛选（可选）
  if (filters?.task_name) {
    conditions.push('tc.task_name LIKE ?');
    values.push(`%${filters.task_name}%`);
  }

  const whereSQL = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

  const countSql = `
    SELECT COUNT(*) as total FROM task_logs tl
    LEFT JOIN task_config tc ON tl.task_code = tc.task_code
    ${whereSQL}
  `;
  const countResult = await query<{ total: number }[]>(countSql, values);
  const total = countResult[0]?.total || 0;

  const sql = `
    SELECT tl.*, tc.task_name FROM task_logs tl
    LEFT JOIN task_config tc ON tl.task_code = tc.task_code
    ${whereSQL}
    ORDER BY tl.created_at DESC
    LIMIT ? OFFSET ?
  `;
  const list = await query<(TaskLogRecord & { task_name: string })[]>(sql, [...values, sizeNum, offset]);

  return {
    list,
    pagination: {
      page: pageNum,
      pageSize: sizeNum,
      total,
    },
  };
};

/**
 * 自动结束过期活动（幂等更新）
 * 返回本次更新的受影响行数
 */
export const autoCloseExpiredActivities = async (): Promise<number> => {
  const sql = `
    UPDATE activities
    SET status = '已结束'
    WHERE status != '已结束' AND end_time < NOW()
  `;
  const result = await query<{ affectedRows: number }>(sql);
  return result.affectedRows;
};

/**
 * 结算已结束活动的服务时长并同步用户总时长。
 * 逻辑：
 *  1) 对已结束且“已同意”并“已签到”的记录，将 service_hours 设置为活动的 service_hours。
 *  2) 随后调用 recalculateAllServiceHours() 将汇总写入 auth_info.total_hours。
 * 返回：本次受影响的报名记录数（用于日志观察）。
 */
export const updateUserServiceHours = async (): Promise<{ updated_participants: number }> => {
  const { updatedParticipants } = await settleEndedActivitiesServiceHours();

  return {
    updated_participants: updatedParticipants,
  };
};
