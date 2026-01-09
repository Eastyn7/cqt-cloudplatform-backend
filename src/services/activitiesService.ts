import { query } from '../db';
import { HTTP_STATUS } from '../utils/response';
import {
  ActivityRecord,
  ActivityWritable,
  ActivityWritableFields
} from '../types/dbTypes';
import { PaginationQuery } from '../types/requestTypes';

/** 创建志愿活动（自动映射可写字段，必填活动名称） */
export const createActivity = async (body: Partial<ActivityWritable>) => {
  if (!body.activity_name) {
    throw { status: HTTP_STATUS.BAD_REQUEST, message: '活动名称不能为空' };
  }

  // 筛选可写字段
  const fields = ActivityWritableFields.filter(key => body[key] !== undefined);
  const placeholders = fields.map(() => '?').join(', ');
  const sql = `
    INSERT INTO activities (${fields.join(', ')})
    VALUES (${placeholders})
  `;
  const values = fields.map(key => body[key] ?? null);

  const result = await query<{ insertId: number }>(sql, values);

  return {
    activity_id: result.insertId,
    activity_name: body.activity_name,
    service_hours: body.service_hours ?? null,
    status: body.status ?? '草稿'
  };
};

/** 更新志愿活动（自动过滤可写字段） */
export const updateActivity = async (
  activity_id: number,
  body: Partial<ActivityWritable>
) => {
  const [existing]: any = await query(
    `SELECT * FROM activities WHERE activity_id = ?`,
    [activity_id]
  );

  if (!existing) {
    throw { status: HTTP_STATUS.NOT_FOUND, message: '活动不存在' };
  }

  const updates: string[] = [];
  const values: any[] = [];

  for (const key of Object.keys(body) as (keyof ActivityWritable)[]) {
    if (ActivityWritableFields.includes(key) && body[key] !== undefined) {
      updates.push(`${key} = ?`);
      values.push(body[key]);
    }
  }

  if (updates.length === 0) {
    throw { status: HTTP_STATUS.BAD_REQUEST, message: '没有可更新字段' };
  }

  await query(
    `UPDATE activities SET ${updates.join(', ')} WHERE activity_id = ?`,
    [...values, activity_id]
  );

  return {
    message: '活动更新成功',
    updated_fields: updates.map(u => u.split('=')[0].trim())
  };
};

/** 删除志愿活动 */
export const deleteActivity = async (activity_id: number) => {
  const [existing]: any = await query(
    `SELECT * FROM activities WHERE activity_id = ?`,
    [activity_id]
  );

  if (!existing) {
    throw { status: HTTP_STATUS.NOT_FOUND, message: '活动不存在' };
  }

  await query(`DELETE FROM activities WHERE activity_id = ?`, [activity_id]);

  return { message: '活动删除成功' };
};

/** 获取所有志愿活动（分页） */
export const getAllActivitiesPage = async (queryParams: any = {}) => {
  const { page = 1, pageSize = 20, search, status, category } = queryParams;

  const pageNum = Number(page) || 1;
  const sizeNum = Number(pageSize) || 20;

  let sql = `
    SELECT 
      a.*, d.dept_name, t.term_name
    FROM activities a
    LEFT JOIN departments d ON a.dept_id = d.dept_id
    LEFT JOIN team_terms t ON a.term_id = t.term_id
  `;

  const conditions: string[] = [];
  const values: any[] = [];

  if (search) {
    conditions.push('(a.activity_name LIKE ? OR d.dept_name LIKE ? OR a.location LIKE ?)');
    values.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  if (status) {
    conditions.push('a.status = ?');
    values.push(status);
  }

  if (category) {
    conditions.push('a.category LIKE ?');
    values.push(`%${category}%`);
  }

  const whereSQL = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const countSql = `
    SELECT COUNT(*) as total
    FROM activities a
    LEFT JOIN departments d ON a.dept_id = d.dept_id
    ${whereSQL}
  `;
  const [{ total }] = await query(countSql, values) as any[];

  sql += ` ${whereSQL} ORDER BY a.created_at DESC LIMIT ? OFFSET ?`;
  values.push(sizeNum, (pageNum - 1) * sizeNum);

  const rows = await query(sql, values);

  return {
    list: rows,
    pagination: {
      page: pageNum,
      pageSize: sizeNum,
      total,
    },
  };
};

/** 获取所有志愿活动（全量） */
export const getAllActivities = async () => {
  const sql = `
    SELECT 
      a.*, 
      d.dept_name, 
      t.term_name
    FROM activities a
    LEFT JOIN departments d ON a.dept_id = d.dept_id
    LEFT JOIN team_terms t ON a.term_id = t.term_id
    ORDER BY a.created_at DESC
  `;

  const rows: any[] = await query(sql);

  return {
    list: rows,
    total: rows.length,
  };
};

/** 按ID获取志愿活动详情（关联部门、届次信息） */
export const getActivityById = async (activity_id: number) => {
  const [row]: any = await query(
    `
    SELECT 
      a.*, d.dept_name, t.term_name
    FROM activities a
    LEFT JOIN departments d ON a.dept_id = d.dept_id
    LEFT JOIN team_terms t ON a.term_id = t.term_id
    WHERE a.activity_id = ?
    `,
    [activity_id]
  );

  if (!row) {
    throw { status: HTTP_STATUS.NOT_FOUND, message: '活动不存在' };
  }

  return row;
};

/** 切换志愿活动状态（支持：草稿、进行中、已结束） */
export const changeActivityStatus = async (
  activity_id: number,
  newStatus: ActivityRecord['status']
) => {
  const validStatuses: ActivityRecord['status'][] = ['草稿', '进行中', '已结束'];

  if (!validStatuses.includes(newStatus)) {
    throw { status: HTTP_STATUS.BAD_REQUEST, message: '非法状态值' };
  }

  const [existing]: any = await query(
    `SELECT * FROM activities WHERE activity_id = ?`,
    [activity_id]
  );

  if (!existing) {
    throw { status: HTTP_STATUS.NOT_FOUND, message: '活动不存在' };
  }

  await query(`UPDATE activities SET status = ? WHERE activity_id = ?`, [
    newStatus,
    activity_id
  ]);

  return { message: `活动状态已更新为：${newStatus}` };
};

/** 获取所有活动的活动类别 */
export const getActivityCategories = async () => {
  const sql = `SELECT DISTINCT category FROM activities WHERE category IS NOT NULL AND category != '' ORDER BY category`;
  const rows: any[] = await query(sql);
  const categories = rows.map((row: any) => row.category);
  return {
    list: categories,
    total: categories.length,
  };
};

/** 获取非草稿志愿活动（分页，公开用） */
export const getVisibleActivitiesPage = async (queryParams: any = {}) => {
  const { page = 1, pageSize = 20, search, status, category } = queryParams;

  const pageNum = Number(page) || 1;
  const sizeNum = Number(pageSize) || 20;

  let sql = `
    SELECT 
      a.*, d.dept_name, t.term_name
    FROM activities a
    LEFT JOIN departments d ON a.dept_id = d.dept_id
    LEFT JOIN team_terms t ON a.term_id = t.term_id
  `;

  const conditions: string[] = ['a.status != ?'];
  const values: any[] = ['草稿'];

  if (search) {
    conditions.push('(a.activity_name LIKE ? OR d.dept_name LIKE ? OR a.location LIKE ?)');
    values.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  if (status && status !== '草稿') {
    conditions.push('a.status = ?');
    values.push(status);
  }

  if (category) {
    conditions.push('a.category LIKE ?');
    values.push(`%${category}%`);
  }

  const whereSQL = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const countSql = `
    SELECT COUNT(*) as total
    FROM activities a
    LEFT JOIN departments d ON a.dept_id = d.dept_id
    ${whereSQL}
  `;
  const [{ total }] = await query(countSql, values) as any[];

  sql += ` ${whereSQL} ORDER BY a.created_at DESC LIMIT ? OFFSET ?`;
  values.push(sizeNum, (pageNum - 1) * sizeNum);

  const rows = await query(sql, values);

  return {
    list: rows,
    pagination: {
      page: pageNum,
      pageSize: sizeNum,
      total,
    },
  };
};

/** 获取非草稿志愿活动（全量，公开用） */
export const getVisibleActivities = async () => {
  const sql = `
    SELECT 
      a.*, 
      d.dept_name, 
      t.term_name
    FROM activities a
    LEFT JOIN departments d ON a.dept_id = d.dept_id
    LEFT JOIN team_terms t ON a.term_id = t.term_id
    WHERE a.status != '草稿'
    ORDER BY a.created_at DESC
  `;

  const rows: any[] = await query(sql);

  return {
    list: rows,
    total: rows.length,
  };
};