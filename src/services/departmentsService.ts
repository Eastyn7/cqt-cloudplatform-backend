import { query } from '../db';
import { Department } from '../types/index';

// 创建部门
export const createDepartment = async (name: string, description: string): Promise<Department> => {
  const result = await query<{ insertId: number }>('INSERT INTO departments (name, description) VALUES (?, ?)', [name, description]);
  return { id: result.insertId, name, description };
};

// 获取所有部门
export const getDepartments = async (): Promise<Department[]> => {
  return query<Department[]>('SELECT id, name, description FROM departments');
};

// 获取单个部门
export const getDepartment = async (id: number): Promise<Department> => {
  const departments = await query<Department[]>('SELECT id, name, description FROM departments WHERE id = ?', [id]);
  if (departments.length === 0) {
    throw new Error('部门不存在');
  }
  return departments[0];
};

// 更新部门
export const updateDepartment = async (id: number, updates: Partial<Department>): Promise<string> => {
  const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
  const values = Object.values(updates);
  if (!fields) {
    throw new Error('没有可更新的字段');
  }
  values.push(id);
  const result = await query<{ affectedRows: number }>(`UPDATE departments SET ${fields} WHERE id = ?`, values);
  return result.affectedRows > 0 ? '更新成功' : '部门不存在或无更改';
};

// 删除部门
export const deleteDepartment = async (id: number): Promise<string> => {
  const result = await query<{ affectedRows: number }>('DELETE FROM departments WHERE id = ?', [id]);
  return result.affectedRows > 0 ? '删除成功' : '部门不存在';
};
