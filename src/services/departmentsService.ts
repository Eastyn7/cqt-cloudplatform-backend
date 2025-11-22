import { query } from '../db';
import { HTTP_STATUS } from '../utils/response';
import {
  DepartmentRecord,
  DepartmentWritable,
  DepartmentWritableFields
} from '../types/dbTypes';

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
      values.push(val);
    }
  }

  const sql = `
    INSERT INTO departments (${fields.join(', ')})
    VALUES (${placeholders.join(', ')})
  `;

  const result: any = await query(sql, values);

  return { dept_id: result.insertId, ...body };
};

/** 获取所有部门（关联负责人姓名，按显示顺序+部门ID排序） */
export const getAllDepartments = async () => {
  const sql = `
    SELECT d.*, i.name AS leader_name
    FROM departments d
    LEFT JOIN auth_info i ON d.leader_id = i.student_id
    ORDER BY d.display_order ASC, d.dept_id ASC;
  `;

  const rows: any[] = await query(sql);

  return {
    total: rows.length,
    data: rows
  };
};

/** 按ID获取单个部门信息（关联负责人姓名） */
export const getDepartmentById = async (dept_id: number) => {
  const sql = `
    SELECT d.*, i.name AS leader_name
    FROM departments d
    LEFT JOIN auth_info i ON d.leader_id = i.student_id
    WHERE d.dept_id = ?;
  `;

  const [department]: any = await query(sql, [dept_id]);

  if (!department) {
    throw { status: HTTP_STATUS.NOT_FOUND, message: '未找到该部门信息' };
  }

  return department;
};

/** 按ID更新部门信息（自动映射字段） */
export const updateDepartment = async (
  dept_id: number,
  body: Partial<DepartmentWritable>
) => {
  const [exists]: any = await query(
    `SELECT dept_id FROM departments WHERE dept_id = ?`,
    [dept_id]
  );
  if (!exists) {
    throw { status: HTTP_STATUS.NOT_FOUND, message: '部门不存在' };
  }

  const updates: string[] = [];
  const values: any[] = [];

  for (const field of DepartmentWritableFields) {
    const val = body[field];
    if (val !== undefined && val !== null) {
      updates.push(`${field} = ?`);
      values.push(val);
    }
  }

  if (updates.length === 0) {
    throw { status: HTTP_STATUS.BAD_REQUEST, message: '没有可更新的字段' };
  }

  const sql = `UPDATE departments SET ${updates.join(', ')} WHERE dept_id = ?`;
  await query(sql, [...values, dept_id]);

  return { message: `部门 ${dept_id} 更新成功` };
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