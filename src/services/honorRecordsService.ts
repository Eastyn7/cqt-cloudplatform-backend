import { query } from '../db';
import { HTTP_STATUS } from '../utils/response';
import {
  HonorRecord,
  HonorWritable,
  HonorWritableFields
} from '../types/dbTypes';
import { PaginationQuery } from '../types/requestTypes';

/** 创建荣誉记录（自动映射可写字段，必填荣誉名称） */
export const createHonorRecord = async (body: Partial<HonorWritable>) => {
  if (!body.honor_title) {
    throw { status: HTTP_STATUS.BAD_REQUEST, message: '荣誉名称不能为空' };
  }

  // 自动构建字段与值
  const fields = HonorWritableFields.filter(f => body[f] !== undefined);
  const placeholders = fields.map(() => '?').join(', ');
  const values = fields.map(f => body[f] ?? null);

  const sql = `
    INSERT INTO honor_records (${fields.join(', ')})
    VALUES (${placeholders})
  `;

  const result: any = await query(sql, values);

  return {
    honor_id: result.insertId,
    ...body
  };
};

/** 更新荣誉记录（自动过滤可写字段） */
export const updateHonorRecord = async (
  honor_id: number,
  body: Partial<HonorWritable>
) => {
  const [existing]: any = await query(
    `SELECT * FROM honor_records WHERE honor_id = ?`,
    [honor_id]
  );

  if (!existing) {
    throw { status: HTTP_STATUS.NOT_FOUND, message: '荣誉记录不存在' };
  }

  const updates: string[] = [];
  const values: any[] = [];

  for (const key of HonorWritableFields) {
    if (body[key] !== undefined) {
      updates.push(`${key} = ?`);
      values.push(body[key]);
    }
  }

  if (updates.length === 0) {
    throw { status: HTTP_STATUS.BAD_REQUEST, message: '没有可更新字段' };
  }

  const sql = `UPDATE honor_records SET ${updates.join(', ')} WHERE honor_id = ?`;
  await query(sql, [...values, honor_id]);

  return { message: '荣誉记录更新成功' };
};

/** 删除荣誉记录 */
export const deleteHonorRecord = async (honor_id: number) => {
  const [existing]: any = await query(
    `SELECT * FROM honor_records WHERE honor_id = ?`,
    [honor_id]
  );

  if (!existing) {
    throw { status: HTTP_STATUS.NOT_FOUND, message: '荣誉记录不存在' };
  }

  await query(`DELETE FROM honor_records WHERE honor_id = ?`, [honor_id]);

  return { message: '荣誉记录删除成功' };
};

/** 获取荣誉记录（分页） */
export const getHonorRecordsPage = async (
  queryParams: PaginationQuery = {}
) => {
  const {
    page = 1,
    pageSize = 20,
    search,
    honor_level,
    term_id,
  } = queryParams as any;

  const pageNum = Number(page) || 1;
  const sizeNum = Number(pageSize) || 20;

  const conditions: string[] = [];
  const values: any[] = [];

  if (search) {
    conditions.push(`
      (
        h.honor_title LIKE ?
        OR a.name LIKE ?
        OR h.student_id LIKE ?
        OR h.issuer LIKE ?
      )
    `);
    values.push(
      `%${search}%`,
      `%${search}%`,
      `%${search}%`,
      `%${search}%`
    );
  }

  if (honor_level) {
    conditions.push('h.honor_level = ?');
    values.push(honor_level);
  }

  if (term_id) {
    conditions.push('h.term_id = ?');
    values.push(term_id);
  }

  const whereSQL = conditions.length
    ? `WHERE ${conditions.join(' AND ')}`
    : '';

  // 总数
  const countSql = `
    SELECT COUNT(*) as total
    FROM honor_records h
    LEFT JOIN auth_info a ON h.student_id = a.student_id
    ${whereSQL}
  `;
  const [{ total }] = (await query(countSql, values)) as any[];

  // 分页数据
  const sql = `
    SELECT 
      h.*,
      a.name AS student_name,
      t.term_name,
      t.is_current
    FROM honor_records h
    LEFT JOIN auth_info a ON h.student_id = a.student_id
    LEFT JOIN team_terms t ON h.term_id = t.term_id
    ${whereSQL}
    ORDER BY h.issue_date DESC, h.honor_level ASC
    LIMIT ? OFFSET ?
  `;
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

/** 获取全部荣誉记录（全量） */
export const getAllHonorRecords = async () => {
  const sql = `
    SELECT 
      h.*,
      a.name AS student_name,
      t.term_name,
      t.is_current
    FROM honor_records h
    LEFT JOIN auth_info a ON h.student_id = a.student_id
    LEFT JOIN team_terms t ON h.term_id = t.term_id
    ORDER BY h.issue_date DESC, h.honor_level ASC
  `;
  const rows: any[] = await query(sql);

  return {
    list: rows,
    total: rows.length,
  };
};

/** 荣誉墙（分页，前台） */
export const getHonorWallPage = async (
  queryParams: PaginationQuery = {}
) => {
  const {
    page = 1,
    pageSize = 20,
    search,
    honor_level,
    term_id,
  } = queryParams as any;

  const pageNum = Number(page) || 1;
  const sizeNum = Number(pageSize) || 20;

  const conditions: string[] = [];
  const values: any[] = [];

  if (search) {
    conditions.push(`
      (
        h.honor_title LIKE ?
        OR a.name LIKE ?
        OR h.issuer LIKE ?
      )
    `);
    values.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  if (honor_level) {
    conditions.push('h.honor_level = ?');
    values.push(honor_level);
  }

  if (term_id) {
    conditions.push('h.term_id = ?');
    values.push(term_id);
  }

  const whereSQL = conditions.length
    ? `WHERE ${conditions.join(' AND ')}`
    : '';

  const countSql = `
    SELECT COUNT(*) as total
    FROM honor_records h
    LEFT JOIN auth_info a ON h.student_id = a.student_id
    ${whereSQL}
  `;
  const [{ total }] = (await query(countSql, values)) as any[];

  const sql = `
    SELECT 
      h.honor_id,
      h.honor_title,
      h.honor_level,
      h.issue_date,
      h.issuer,
      h.description,
      a.student_id,
      a.name AS student_name,
      t.term_id,
      t.term_name,
      t.is_current
    FROM honor_records h
    LEFT JOIN auth_info a ON h.student_id = a.student_id
    LEFT JOIN team_terms t ON h.term_id = t.term_id
    ${whereSQL}
    ORDER BY t.start_date DESC, h.issue_date DESC
    LIMIT ? OFFSET ?
  `;
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

/** 荣誉墙（全量，前台，无筛选） */
export const getHonorWallAll = async () => {
  const sql = `
    SELECT 
      t.term_id,
      t.term_name,
      t.is_current,
      h.honor_id,
      h.honor_title,
      h.honor_level,
      h.issue_date,
      h.issuer,
      h.description,
      a.student_id,
      a.name AS student_name
    FROM team_terms t
    LEFT JOIN honor_records h ON t.term_id = h.term_id
    LEFT JOIN auth_info a ON h.student_id = a.student_id
    ORDER BY t.start_date DESC, h.issue_date DESC
  `;

  const rows: any[] = await query(sql);

  const termMap: Record<number, any> = {};

  for (const row of rows) {
    if (!termMap[row.term_id]) {
      termMap[row.term_id] = {
        term_id: row.term_id,
        term_name: row.term_name,
        is_current: row.is_current,
        honors: [],
      };
    }

    if (row.honor_id) {
      termMap[row.term_id].honors.push({
        honor_id: row.honor_id,
        honor_title: row.honor_title,
        honor_level: row.honor_level,
        issue_date: row.issue_date,
        issuer: row.issuer,
        description: row.description,
        student_id: row.student_id,
        student_name: row.student_name,
      });
    }
  }

  const list = Object.values(termMap);

  return {
    list,
    total: list.length,
  };
};

/** 批量创建荣誉记录（自动映射可写字段，返回创建/失败详情） */
export const batchCreateHonorRecords = async (
  records: Partial<HonorWritable>[]
) => {
  if (!Array.isArray(records) || records.length === 0) {
    throw { status: HTTP_STATUS.BAD_REQUEST, message: '请求体必须为非空数组' };
  }

  const created: any[] = [];
  const failed: any[] = [];

  for (const item of records) {
    if (!item.honor_title) {
      failed.push({
        honor_title: item.honor_title,
        reason: '缺少必要字段 honor_title'
      });
      continue;
    }

    try {
      const fields = HonorWritableFields.filter(f => item[f] !== undefined);
      const placeholders = fields.map(() => '?').join(', ');
      const values = fields.map(f => item[f] ?? null);

      const sql = `
        INSERT INTO honor_records (${fields.join(', ')})
        VALUES (${placeholders})
      `;

      const result: any = await query(sql, values);

      created.push({
        honor_id: result.insertId,
        ...item
      });
    } catch (error: any) {
      failed.push({
        honor_title: item.honor_title,
        reason: error.message || '数据库错误'
      });
    }
  }

  return {
    total: records.length,
    created: created.length,
    failed: failed.length,
    createdList: created,
    failedList: failed
  };
};