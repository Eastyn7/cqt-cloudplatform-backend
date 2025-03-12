import { query } from '../db';
import { BackboneMember } from '../types/index';

/**
 * 创建骨干成员
 */
export const createBackboneMember = async (
  auth_id: number,
  department_id: number,
  role_id: number,
  role_name: string,
  photo: string,
  description: string
): Promise<BackboneMember> => {
  await query<{ affectedRows: number }>(
    `INSERT INTO backbone_members (auth_id, department_id, role_id, role_name, photo, description) 
     VALUES (?, ?, ?, ?, ?, ?)`,
    [auth_id, department_id, role_id, role_name, photo, description]
  );

  return { auth_id, department_id, role_id, role_name, photo, description };
};

/**
 * 获取所有骨干成员
 */
export const getBackboneMembers = async (): Promise<BackboneMember[]> => {
  return query<BackboneMember[]>(
    `SELECT bm.auth_id, bm.department_id, bm.role_id, bm.role_name, bm.photo, bm.description, al.student_id, ai.username 
     FROM backbone_members bm 
     JOIN departments d ON bm.department_id = d.id
     JOIN auth_login al ON bm.auth_id = al.auth_id
     JOIN auth_info ai ON bm.auth_id = ai.auth_id
     ORDER BY bm.auth_id ASC`
  );
};


/**
 * 获取单个骨干成员
 */
export const getBackboneMember = async (auth_id: number): Promise<BackboneMember> => {
  const members = await query<BackboneMember[]>(
    `SELECT bm.auth_id, bm.department_id, d.department_name, bm.role_id, bm.role_name, bm.photo, bm.description, bm.created_at, bm.updated_at 
     FROM backbone_members bm 
     JOIN departments d ON bm.department_id = d.id
     WHERE bm.auth_id = ?`,
    [auth_id]
  );

  if (members.length === 0) {
    throw new Error('骨干成员不存在');
  }
  return members[0];
};

/**
 * 更新骨干成员信息
 */
export const updateBackboneMember = async (
  auth_id: number,
  updates: Partial<BackboneMember>
): Promise<string> => {
  const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
  const values = Object.values(updates);

  if (!fields) {
    throw new Error('没有可更新的字段');
  }

  values.push(auth_id);
  const result = await query<{ affectedRows: number }>(
    `UPDATE backbone_members SET ${fields} WHERE auth_id = ?`,
    values
  );

  return result.affectedRows > 0 ? '更新成功' : '骨干成员不存在或无更改';
};

/**
 * 删除骨干成员
 */
export const deleteBackboneMember = async (auth_id: number): Promise<string> => {
  const result = await query<{ affectedRows: number }>(
    `DELETE FROM backbone_members WHERE auth_id = ?`,
    [auth_id]
  );
  return result.affectedRows > 0 ? '删除成功' : '骨干成员不存在';
};
