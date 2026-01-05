import { query } from '../db';
import { HTTP_STATUS } from '../utils/response';
import { deleteFileFromOSS } from '../oss/deleteService';
import {
  TeamMilestoneWritable,
  TeamMilestoneWritableFields,
  TeamMilestoneRecord
} from '../types/dbTypes';
import { PaginationQuery } from '../types/requestTypes';

/** 创建里程碑事件（必填标题和日期，图片上传需配套image_key，自动映射可写字段） */
export const createMilestone = async (
  body: Partial<TeamMilestoneWritable>
) => {
  if (!body.title || !body.event_date) {
    throw {
      status: HTTP_STATUS.BAD_REQUEST,
      message: '标题和事件日期不能为空'
    };
  }

  // 自动构建插入字段与值
  const fields = TeamMilestoneWritableFields;
  const values = fields.map(f => body[f] ?? null);

  const sql = `
    INSERT INTO team_milestones (${fields.join(', ')})
    VALUES (${fields.map(() => '?').join(', ')})
  `;

  const result: any = await query(sql, values);

  return { message: '里程碑创建成功', milestone_id: result.insertId };
};

/** 更新里程碑（支持OSS图片替换，自动过滤可写字段） */
export const updateMilestone = async (
  milestone_id: number,
  body: Partial<TeamMilestoneWritable>
) => {
  const rows = await query<TeamMilestoneRecord[]>(
    `SELECT * FROM team_milestones WHERE milestone_id = ?`,
    [milestone_id]
  );
  const existing = rows[0];

  if (!existing) {
    throw { status: HTTP_STATUS.NOT_FOUND, message: '里程碑不存在' };
  }

  const updates: string[] = [];
  const values: any[] = [];

  // 图片替换逻辑（需提供image_key）
  if (body.image_key && body.image_key !== existing.image_key) {
    // 删除旧OSS图片
    if (existing.image_key) {
      await deleteFileFromOSS(existing.image_key);
    }

    updates.push('image_key = ?');
    values.push(body.image_key);
  }

  // 自动更新其他普通字段
  for (const key of TeamMilestoneWritableFields) {
    if (
      key !== 'image_key' &&
      body[key] !== undefined
    ) {
      updates.push(`${key} = ?`);
      values.push(body[key]);
    }
  }

  if (updates.length === 0) {
    throw { status: HTTP_STATUS.BAD_REQUEST, message: '没有可更新字段' };
  }

  const sql = `
    UPDATE team_milestones SET ${updates.join(', ')}
    WHERE milestone_id = ?
  `;

  await query(sql, [...values, milestone_id]);

  return { message: '里程碑更新成功' };
};

/** 删除里程碑（连带删除OSS图片文件） */
export const deleteMilestone = async (milestone_id: number) => {
  const rows = await query<TeamMilestoneRecord[]>(
    `SELECT * FROM team_milestones WHERE milestone_id = ?`,
    [milestone_id]
  );
  const existing = rows[0];

  if (!existing) {
    throw { status: HTTP_STATUS.NOT_FOUND, message: '里程碑不存在' };
  }

  // 删除OSS图片
  if (existing.image_key) {
    await deleteFileFromOSS(existing.image_key);
  }

  await query(
    `DELETE FROM team_milestones WHERE milestone_id = ?`,
    [milestone_id]
  );

  return { message: '里程碑删除成功' };
};

/** 获取所有里程碑（分页） */
export const getAllMilestonesPage = async (queryParams: PaginationQuery = {}) => {
  const { page = 1, pageSize = 20, search } = queryParams;

  const pageNum = Number(page) || 1;
  const sizeNum = Number(pageSize) || 20;

  let sql = `
    SELECT m.*, t.term_name
    FROM team_milestones m
    LEFT JOIN team_terms t ON m.term_id = t.term_id
  `;

  const conditions: string[] = [];
  const values: any[] = [];

  if (search) {
    conditions.push('(m.title LIKE ? OR m.description LIKE ? OR t.term_name LIKE ?)');
    values.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  const whereSQL = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  // 统计总数
  const countSql = `SELECT COUNT(*) as total FROM team_milestones m ${whereSQL}`;
  const [{ total }] = await query(countSql, values) as any[];

  // 分页查询
  sql += ` ${whereSQL} ORDER BY m.event_date DESC LIMIT ? OFFSET ?`;
  values.push(sizeNum, (pageNum - 1) * sizeNum);

  const rows = await query<TeamMilestoneRecord[]>(sql, values);

  return {
    list: rows,
    pagination: {
      page: pageNum,
      pageSize: sizeNum,
      total,
    },
  };
};

/** 获取所有里程碑（全量） */
export const getAllMilestones = async () => {
  const sql = `
    SELECT m.*, t.term_name
    FROM team_milestones m
    LEFT JOIN team_terms t ON m.term_id = t.term_id
    ORDER BY m.event_date DESC
  `;

  const rows = await query<TeamMilestoneRecord[]>(sql);

  return {
    total: rows.length,
    data: rows,
  };
};

/** 按届次筛选里程碑（分页） */
export const getMilestonesByTermPage = async (term_id: number, queryParams: PaginationQuery = {}) => {
  const { page = 1, pageSize = 20, search } = queryParams;

  const pageNum = Number(page) || 1;
  const sizeNum = Number(pageSize) || 20;

  let sql = `SELECT * FROM team_milestones WHERE term_id = ?`;

  const conditions: string[] = [];
  const values: any[] = [term_id];

  if (search) {
    conditions.push('(title LIKE ? OR description LIKE ?)');
    values.push(`%${search}%`, `%${search}%`);
  }

  const whereSQL = conditions.length ? ` AND ${conditions.join(' AND ')}` : '';

  // 统计总数
  const countSql = `SELECT COUNT(*) as total FROM team_milestones WHERE term_id = ? ${whereSQL}`;
  const [{ total }] = await query(countSql, values) as any[];

  // 分页查询
  sql += ` ${whereSQL} ORDER BY event_date ASC LIMIT ? OFFSET ?`;
  values.push(sizeNum, (pageNum - 1) * sizeNum);

  const rows = await query<TeamMilestoneRecord[]>(sql, values);

  return {
    list: rows,
    pagination: {
      page: pageNum,
      pageSize: sizeNum,
      total,
    },
  };
};

/** 按届次筛选里程碑（全量） */
export const getMilestonesByTerm = async (term_id: number) => {
  const sql = `SELECT * FROM team_milestones WHERE term_id = ? ORDER BY event_date ASC`;

  const rows = await query<TeamMilestoneRecord[]>(sql, [term_id]);

  return {
    total: rows.length,
    data: rows,
  };
};

/** 按事件类型筛选里程碑（分页） */
export const getMilestonesByTypePage = async (event_type: string, queryParams: PaginationQuery = {}) => {
  const { page = 1, pageSize = 20, search } = queryParams;

  const pageNum = Number(page) || 1;
  const sizeNum = Number(pageSize) || 20;

  let sql = `SELECT * FROM team_milestones WHERE event_type = ?`;

  const conditions: string[] = [];
  const values: any[] = [event_type];

  if (search) {
    conditions.push('(title LIKE ? OR description LIKE ?)');
    values.push(`%${search}%`, `%${search}%`);
  }

  const whereSQL = conditions.length ? ` AND ${conditions.join(' AND ')}` : '';

  // 统计总数
  const countSql = `SELECT COUNT(*) as total FROM team_milestones WHERE event_type = ? ${whereSQL}`;
  const [{ total }] = await query(countSql, values) as any[];

  // 分页查询
  sql += ` ${whereSQL} ORDER BY event_date ASC LIMIT ? OFFSET ?`;
  values.push(sizeNum, (pageNum - 1) * sizeNum);

  const rows = await query<TeamMilestoneRecord[]>(sql, values);

  return {
    list: rows,
    pagination: {
      page: pageNum,
      pageSize: sizeNum,
      total,
    },
  };
};

/** 按事件类型筛选里程碑（全量） */
export const getMilestonesByType = async (event_type: string) => {
  const sql = `SELECT * FROM team_milestones WHERE event_type = ? ORDER BY event_date ASC`;

  const rows = await query<TeamMilestoneRecord[]>(sql, [event_type]);

  return {
    total: rows.length,
    data: rows,
  };
};

/** 按时间范围筛选里程碑（分页） */
export const getMilestonesByDateRangePage = async (
  start: string,
  end: string,
  queryParams: PaginationQuery = {}
) => {
  const { page = 1, pageSize = 20, search } = queryParams;

  const pageNum = Number(page) || 1;
  const sizeNum = Number(pageSize) || 20;

  let sql = `SELECT * FROM team_milestones WHERE event_date BETWEEN ? AND ?`;

  const conditions: string[] = [];
  const values: any[] = [start, end];

  if (search) {
    conditions.push('(title LIKE ? OR description LIKE ?)');
    values.push(`%${search}%`, `%${search}%`);
  }

  const whereSQL = conditions.length ? ` AND ${conditions.join(' AND ')}` : '';

  // 统计总数
  const countSql = `SELECT COUNT(*) as total FROM team_milestones WHERE event_date BETWEEN ? AND ? ${whereSQL}`;
  const [{ total }] = await query(countSql, values) as any[];

  // 分页查询
  sql += ` ${whereSQL} ORDER BY event_date ASC LIMIT ? OFFSET ?`;
  values.push(sizeNum, (pageNum - 1) * sizeNum);

  const rows = await query<TeamMilestoneRecord[]>(sql, values);

  return {
    list: rows,
    pagination: {
      page: pageNum,
      pageSize: sizeNum,
      total,
    },
  };
};

/** 按时间范围筛选里程碑（全量） */
export const getMilestonesByDateRange = async (start: string, end: string) => {
  const sql = `SELECT * FROM team_milestones WHERE event_date BETWEEN ? AND ? ORDER BY event_date ASC`;

  const rows = await query<TeamMilestoneRecord[]>(sql, [start, end]);

  return {
    total: rows.length,
    data: rows,
  };
};