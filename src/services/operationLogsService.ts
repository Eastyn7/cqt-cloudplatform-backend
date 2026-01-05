import { query } from '../db';
import { HTTP_STATUS } from '../utils/response';
import { OperationLogRecord } from '../types/dbTypes';

/** 查询参数类型（避免 any） */
interface OperationLogQueryParams {
  page?: number | string;
  pageSize?: number | string;
  user_id?: string;
  action?: string;
  start_date?: string;
  end_date?: string;
}

/** 后台分页查询操作日志（支持用户ID、操作类型、时间范围多条件过滤） */
export const getOperationLogs = async (queryParams: OperationLogQueryParams) => {
  let {
    page = 1,
    pageSize = 20,
    user_id,
    action,
    start_date,
    end_date,
  } = queryParams;

  // 格式化分页参数为数字
  page = Number(page) || 1;
  pageSize = Number(pageSize) || 20;

  const conditions: string[] = [];
  const values: any[] = [];

  // 拼接查询条件
  if (user_id) {
    conditions.push('user_id = ?');
    values.push(user_id);
  }
  if (action) {
    conditions.push('action = ?');
    values.push(action);
  }
  if (start_date) {
    conditions.push('created_at >= ?');
    values.push(start_date);
  }
  if (end_date) {
    conditions.push('created_at <= ?');
    values.push(end_date);
  }

  const whereSQL = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  // 统计符合条件的日志总数
  const totalSql = `SELECT COUNT(*) AS total FROM operation_logs ${whereSQL}`;
  const [{ total }]: { total: number }[] = await query(totalSql, values);

  const offset = (page - 1) * pageSize;

  // 分页查询日志数据（按创建时间倒序）
  const sql = `
    SELECT *
    FROM operation_logs
    ${whereSQL}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `;

  const rows: OperationLogRecord[] = await query(sql, [...values, pageSize, offset]);

  return { 
    list: rows, 
    pagination: { 
      page, 
      pageSize, 
      total 
    } 
  };
};

/** 查看单条操作日志详情 */
export const getOperationLogById = async (log_id: number) => {
  const [row]: OperationLogRecord[] = await query(
    `SELECT * FROM operation_logs WHERE log_id = ?`,
    [log_id]
  );

  if (!row) {
    throw {
      status: HTTP_STATUS.NOT_FOUND,
      message: '日志不存在',
    };
  }

  return row;
};