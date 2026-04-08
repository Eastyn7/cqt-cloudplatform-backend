import { query } from '../db';
import { HTTP_STATUS } from '../utils/response';
import {
  PortraitDimensionRecord,
  PortraitDimensionWritable,
  PortraitDimensionWritableFields
} from '../types/dbTypes';
import { PaginationQuery } from '../types/requestTypes';

/** 创建画像维度 */
export const createPortraitDimension = async (body: Partial<PortraitDimensionWritable>) => {
  if (!body.dimension_code || !body.dimension_name) {
    throw { status: HTTP_STATUS.BAD_REQUEST, message: '维度编码和名称不能为空' };
  }

  const [exists]: any = await query(
    `SELECT dimension_id FROM portrait_dimensions WHERE dimension_code = ?`,
    [body.dimension_code]
  );

  if (exists) {
    throw { status: HTTP_STATUS.CONFLICT, message: '维度编码已存在' };
  }

  const fields: string[] = [];
  const placeholders: string[] = [];
  const values: any[] = [];

  for (const field of PortraitDimensionWritableFields) {
    const val = (body as any)[field];
    if (val !== undefined) {
      fields.push(field);
      placeholders.push('?');
      values.push(val === '' ? null : val);
    }
  }

  const sql = `
    INSERT INTO portrait_dimensions (${fields.join(', ')})
    VALUES (${placeholders.join(', ')})
  `;

  const result: any = await query(sql, values);

  return { dimension_id: result.insertId, ...body };
};

/** 分页查询画像维度 */
export const getPortraitDimensionsPage = async (queryParams: PaginationQuery = {}) => {
  const { page = 1, pageSize = 20, search, enabled } = queryParams as any;

  const pageNum = Number(page) || 1;
  const sizeNum = Number(pageSize) || 20;

  const conditions: string[] = [];
  const values: any[] = [];

  if (search) {
    conditions.push('(dimension_code LIKE ? OR dimension_name LIKE ?)');
    values.push(`%${search}%`, `%${search}%`);
  }

  if (enabled !== undefined && enabled !== '') {
    conditions.push('enabled = ?');
    values.push(Number(enabled));
  }

  const whereSQL = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const countSql = `SELECT COUNT(*) as total FROM portrait_dimensions ${whereSQL}`;
  const [{ total }] = (await query(countSql, values)) as any[];

  const sql = `
    SELECT *
    FROM portrait_dimensions
    ${whereSQL}
    ORDER BY sort_order ASC, dimension_id ASC
    LIMIT ? OFFSET ?
  `;

  values.push(sizeNum, (pageNum - 1) * sizeNum);
  const rows: PortraitDimensionRecord[] = await query(sql, values);

  return {
    list: rows,
    pagination: {
      page: pageNum,
      pageSize: sizeNum,
      total,
    },
  };
};

/** 获取全部画像维度 */
export const getAllPortraitDimensions = async (enabled?: number) => {
  const conditions: string[] = [];
  const values: any[] = [];

  if (enabled !== undefined) {
    conditions.push('enabled = ?');
    values.push(enabled);
  }

  const whereSQL = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const sql = `
    SELECT *
    FROM portrait_dimensions
    ${whereSQL}
    ORDER BY sort_order ASC, dimension_id ASC
  `;

  const rows: PortraitDimensionRecord[] = await query(sql, values);

  return {
    list: rows,
    total: rows.length,
  };
};

/** 获取单个画像维度 */
export const getPortraitDimensionById = async (dimension_id: number) => {
  const [row]: PortraitDimensionRecord[] = await query(
    `SELECT * FROM portrait_dimensions WHERE dimension_id = ?`,
    [dimension_id]
  );

  if (!row) {
    throw { status: HTTP_STATUS.NOT_FOUND, message: '维度不存在' };
  }

  return row;
};

/** 更新画像维度 */
export const updatePortraitDimension = async (
  dimension_id: number,
  body: Partial<PortraitDimensionWritable>
) => {
  const [exists]: any = await query(
    `SELECT dimension_id FROM portrait_dimensions WHERE dimension_id = ?`,
    [dimension_id]
  );

  if (!exists) {
    throw { status: HTTP_STATUS.NOT_FOUND, message: '维度不存在' };
  }

  if (body.dimension_code) {
    const [codeExists]: any = await query(
      `SELECT dimension_id FROM portrait_dimensions WHERE dimension_code = ? AND dimension_id != ?`,
      [body.dimension_code, dimension_id]
    );

    if (codeExists) {
      throw { status: HTTP_STATUS.CONFLICT, message: '维度编码已存在' };
    }
  }

  const updates: string[] = [];
  const values: any[] = [];

  for (const field of PortraitDimensionWritableFields) {
    const val = (body as any)[field];
    if (val !== undefined) {
      updates.push(`${field} = ?`);
      values.push(val === '' ? null : val);
    }
  }

  if (updates.length === 0) {
    throw { status: HTTP_STATUS.BAD_REQUEST, message: '没有可更新字段' };
  }

  const sql = `UPDATE portrait_dimensions SET ${updates.join(', ')} WHERE dimension_id = ?`;
  await query(sql, [...values, dimension_id]);

  return { message: '维度更新成功' };
};

/** 删除画像维度 */
export const deletePortraitDimension = async (dimension_id: number) => {
  const result: any = await query(
    `DELETE FROM portrait_dimensions WHERE dimension_id = ?`,
    [dimension_id]
  );

  if (result.affectedRows === 0) {
    throw { status: HTTP_STATUS.NOT_FOUND, message: '维度不存在或已删除' };
  }

  return { message: '维度删除成功' };
};
