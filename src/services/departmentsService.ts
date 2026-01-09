import { query } from '../db';
import { HTTP_STATUS } from '../utils/response';
import {
  DepartmentRecord,
  DepartmentWritable,
  DepartmentWritableFields
} from '../types/dbTypes';
import { PaginationQuery } from '../types/requestTypes';

/** 创建部门（自动映射字段，校验名称唯一性） */
export const createDepartment = async (body: Partial<DepartmentWritable>) => {
  if (!body.dept_name) {
    throw { status: HTTP_STATUS.BAD_REQUEST, message: '部门名称不能为空' };
  }

  // 检查重名
  const [exists]: any = await query(
    `SELECT dept_id FROM departments WHERE dept_name = ?`,
    [body.dept_name]
  );
  if (exists) {
    throw { status: HTTP_STATUS.CONFLICT, message: '该部门名称已存在' };
  }

  // 自动构建字段
  const fields: string[] = [];
  const placeholders: string[] = [];
  const values: any[] = [];

  for (const field of DepartmentWritableFields) {
    const val = body[field];
    if (val !== undefined) {
      fields.push(field);
      placeholders.push('?');
      values.push(val === '' ? null : val);
    }
  }

  const sql = `
    INSERT INTO departments (${fields.join(', ')})
    VALUES (${placeholders.join(', ')})
  `;

  const result: any = await query(sql, values);

  return { dept_id: result.insertId, ...body };
};

/** 分页查询部门 */
export const getDepartmentsPage = async (
  queryParams: PaginationQuery = {}
) => {
  const { page = 1, pageSize = 20, search } = queryParams as any;

  const pageNum = Number(page) || 1;
  const sizeNum = Number(pageSize) || 20;

  const conditions: string[] = [];
  const values: any[] = [];

  if (search) {
    conditions.push(`
      (
        d.dept_name LIKE ?
        OR d.leader_id LIKE ?
        OR l.name LIKE ?
      )
    `);
    values.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  const whereSQL = conditions.length
    ? `WHERE ${conditions.join(' AND ')}`
    : '';

  // 统计总数
  const countSql = `
    SELECT COUNT(*) as total
    FROM departments d
    LEFT JOIN auth_info l ON d.leader_id = l.student_id
    ${whereSQL}
  `;
  const [{ total }] = (await query(countSql, values)) as any[];

  // 分页查询
  const sql = `
    SELECT 
      d.*,
      l.name AS leader_name,
      m.name AS manager_name
    FROM departments d
    LEFT JOIN auth_info l ON d.leader_id = l.student_id
    LEFT JOIN auth_info m ON d.manager_id = m.student_id
    ${whereSQL}
    ORDER BY d.display_order DESC, d.dept_id ASC
    LIMIT ? OFFSET ?
  `;

  values.push(sizeNum, (pageNum - 1) * sizeNum);
  const rows: DepartmentRecord[] = await query(sql, values);

  return {
    list: rows,
    pagination: {
      page: pageNum,
      pageSize: sizeNum,
      total,
    },
  };
};

/** 获取所有部门（全量） */
export const getAllDepartments = async () => {
  const sql = `
    SELECT 
      d.*,
      l.name AS leader_name,
      m.name AS manager_name
    FROM departments d
    LEFT JOIN auth_info l ON d.leader_id = l.student_id
    LEFT JOIN auth_info m ON d.manager_id = m.student_id
    ORDER BY d.display_order DESC, d.dept_id ASC
  `;

  const rows: DepartmentRecord[] = await query(sql);

  return {
    list: rows,
    total: rows.length,
  };
};

/** 获取单个部门详情 */
export const getDepartmentById = async (dept_id: number) => {
  const sql = `
    SELECT 
      d.*,
      l.name AS leader_name,
      m.name AS manager_name
    FROM departments d
    LEFT JOIN auth_info l ON d.leader_id = l.student_id
    LEFT JOIN auth_info m ON d.manager_id = m.student_id
    WHERE d.dept_id = ?
  `;

  const [department]: DepartmentRecord[] = await query(sql, [dept_id]);

  if (!department) {
    throw { status: HTTP_STATUS.NOT_FOUND, message: '未找到该部门信息' };
  }

  return department;
};

/** 更新部门（支持更新 manager_id） */
export const updateDepartment = async (dept_id: number, body: Partial<DepartmentWritable>) => {
  const [exists]: any = await query(`SELECT 1 FROM departments WHERE dept_id = ?`, [dept_id]);
  if (!exists) {
    throw { status: HTTP_STATUS.NOT_FOUND, message: '部门不存在' };
  }

  // 如果更新了 dept_name 也要检查重名（排除自己）
  if (body.dept_name) {
    const [nameExists]: any = await query(
      `SELECT dept_id FROM departments WHERE dept_name = ? AND dept_id != ?`,
      [body.dept_name, dept_id]
    );
    if (nameExists) {
      throw { status: HTTP_STATUS.CONFLICT, message: '该部门名称已存在' };
    }
  }

  const updates: string[] = [];
  const values: any[] = [];

  for (const field of DepartmentWritableFields) {
    const val = body[field];
    if (val !== undefined) {
      updates.push(`${field} = ?`);
      values.push(val === '' ? null : val);
    }
  }

  if (updates.length === 0) {
    throw { status: HTTP_STATUS.BAD_REQUEST, message: '没有可更新的字段' };
  }

  const sql = `UPDATE departments SET ${updates.join(', ')} WHERE dept_id = ?`;
  await query(sql, [...values, dept_id]);

  return { message: '部门信息更新成功' };
};

/** 按ID删除部门 */
export const deleteDepartment = async (dept_id: number) => {
  const sql = `DELETE FROM departments WHERE dept_id = ?`;
  const result: any = await query(sql, [dept_id]);

  if (result.affectedRows === 0) {
    throw {
      status: HTTP_STATUS.NOT_FOUND,
      message: '部门不存在或已被删除'
    };
  }

  return { message: `部门 ${dept_id} 删除成功` };
};

/** 批量创建部门（自动映射字段，校验名称唯一性，返回创建/跳过详情） */
export const batchCreateDepartments = async (
  departments: Partial<DepartmentWritable>[]
) => {
  if (!Array.isArray(departments) || departments.length === 0) {
    throw {
      status: HTTP_STATUS.BAD_REQUEST,
      message: '请求体必须为非空部门数组'
    };
  }

  const created: any[] = [];
  const skipped: any[] = [];

  for (const [index, body] of departments.entries()) {
    if (!body || !body.dept_name) {
      skipped.push({
        index: index + 1,
        reason: '部门名称不能为空'
      });
      continue;
    }

    // 检查重名
    const [exists]: any = await query(
      `SELECT dept_id FROM departments WHERE dept_name = ?`,
      [body.dept_name]
    );

    if (exists) {
      skipped.push({
        dept_name: body.dept_name,
        reason: '部门名称已存在'
      });
      continue;
    }

    // 自动构建字段
    const fields: string[] = [];
    const placeholders: string[] = [];
    const values: any[] = [];

    for (const field of DepartmentWritableFields) {
      const val = body[field];
      if (val !== undefined) {
        fields.push(field);
        placeholders.push('?');
        values.push(val);
      }
    }

    const sql = `
      INSERT INTO departments (${fields.join(', ')})
      VALUES (${placeholders.join(', ')})
    `;

    const result: any = await query(sql, values);

    created.push({
      dept_id: result.insertId,
      ...body
    });
  }

  return {
    message: '批量部门创建完成',
    total: departments.length,
    created: created.length,
    skipped: skipped.length,
    details: { created, skipped }
  };
};