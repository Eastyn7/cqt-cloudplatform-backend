import { query } from '../db';
import { HTTP_STATUS } from '../utils/response';
import {
  TeamTermRecord,
  TeamTermWritable,
  TeamTermWritableFields,
} from '../types/dbTypes';

/** 创建届次（自动映射字段，校验名称唯一，支持设置当前届） */
export const createTeamTerm = async (body: Partial<TeamTermWritable>) => {
  const { term_name, is_current = 0 } = body;

  if (!term_name) {
    throw { status: HTTP_STATUS.BAD_REQUEST, message: '届次名称不能为空' };
  }

  // 校验重名
  const [exists]: any = await query(
    `SELECT term_id FROM team_terms WHERE term_name = ?`,
    [term_name]
  );
  if (exists) {
    throw { status: HTTP_STATUS.CONFLICT, message: '该届次名称已存在' };
  }

  // 设置当前届则取消其他届
  if (is_current === 1) {
    await query(`UPDATE team_terms SET is_current = 0`);
  }

  // 自动构建字段
  const columns = TeamTermWritableFields.join(', ');
  const placeholders = TeamTermWritableFields.map(() => '?').join(', ');
  const values = TeamTermWritableFields.map((f) => (body as any)[f] ?? null);

  const sql = `
    INSERT INTO team_terms (${columns})
    VALUES (${placeholders})
  `;

  const result: any = await query(sql, values);

  return {
    term_id: result.insertId,
    ...body,
    is_current,
  };
};

/** 获取所有届次（按开始时间+届次ID倒序） */
export const getAllTeamTerms = async () => {
  const sql = `
    SELECT *
    FROM team_terms
    ORDER BY start_date DESC, term_id DESC;
  `;
  const rows: any[] = await query(sql);
  return { total: rows.length, data: rows };
};

/** 按ID获取单个届次 */
export const getTeamTermById = async (term_id: number) => {
  const [term]: any = await query(
    `SELECT * FROM team_terms WHERE term_id = ?`,
    [term_id]
  );

  if (!term) {
    throw { status: HTTP_STATUS.NOT_FOUND, message: '未找到该届次信息' };
  }

  return term;
};

/** 按ID更新届次（自动映射字段，支持设置当前届） */
export const updateTeamTerm = async (
  term_id: number,
  body: Partial<TeamTermWritable>
) => {
  const [exists]: any = await query(
    `SELECT * FROM team_terms WHERE term_id = ?`,
    [term_id]
  );

  if (!exists) {
    throw { status: HTTP_STATUS.NOT_FOUND, message: '届次不存在' };
  }

  // 自动构建更新字段
  const updates: string[] = [];
  const values: any[] = [];

  for (const key of TeamTermWritableFields) {
    if (body[key] !== undefined && body[key] !== null) {
      updates.push(`${key} = ?`);
      values.push((body as any)[key]);
    }
  }

  if (updates.length === 0) {
    throw { status: HTTP_STATUS.BAD_REQUEST, message: '没有可更新的字段' };
  }

  // 设置当前届则取消其他届
  if (body.is_current === 1) {
    await query(
      `UPDATE team_terms SET is_current = 0 WHERE term_id != ?`,
      [term_id]
    );
  }

  const sql = `UPDATE team_terms SET ${updates.join(', ')} WHERE term_id = ?`;
  await query(sql, [...values, term_id]);

  return { message: `届次 ${term_id} 更新成功` };
};

/** 按ID删除届次 */
export const deleteTeamTerm = async (term_id: number) => {
  const sql = `DELETE FROM team_terms WHERE term_id = ?`;
  const result: any = await query(sql, [term_id]);

  if (result.affectedRows === 0) {
    throw {
      status: HTTP_STATUS.NOT_FOUND,
      message: '届次不存在或已被删除',
    };
  }

  return { message: `届次 ${term_id} 删除成功` };
};

/** 批量创建届次（自动映射字段，校验名称唯一，返回创建/跳过详情） */
export const batchCreateTeamTerms = async (
  terms: Partial<TeamTermWritable>[]
) => {
  if (!Array.isArray(terms) || terms.length === 0) {
    throw {
      status: HTTP_STATUS.BAD_REQUEST,
      message: '请求体必须为非空届次数组',
    };
  }

  const created: any[] = [];
  const skipped: any[] = [];

  for (const [index, term] of terms.entries()) {
    const { term_name, is_current = 0 } = term || {};

    if (!term_name) {
      skipped.push({ index: index + 1, reason: '届次名称不能为空' });
      continue;
    }

    // 校验重名
    const [exists]: any = await query(
      `SELECT term_id FROM team_terms WHERE term_name = ?`,
      [term_name]
    );
    if (exists) {
      skipped.push({ term_name, reason: '届次名称已存在' });
      continue;
    }

    try {
      // 设置当前届则取消其他届
      if (is_current === 1) {
        await query(`UPDATE team_terms SET is_current = 0`);
      }

      // 自动构建字段
      const columns = TeamTermWritableFields.join(', ');
      const placeholders = TeamTermWritableFields.map(() => '?').join(', ');
      const values = TeamTermWritableFields.map((f) => (term as any)[f] ?? null);

      const sql = `
        INSERT INTO team_terms (${columns})
        VALUES (${placeholders})
      `;

      const result: any = await query(sql, values);

      created.push({
        term_id: result.insertId,
        ...term,
        is_current,
      });
    } catch (err: any) {
      skipped.push({
        term_name,
        reason: err.message || '数据库插入失败',
      });
    }
  }

  return {
    message: '批量届次创建完成',
    total: terms.length,
    created: created.length,
    skipped: skipped.length,
    details: { created, skipped },
  };
};