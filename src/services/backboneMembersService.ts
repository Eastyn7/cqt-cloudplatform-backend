import { query } from '../db';
import { HTTP_STATUS } from '../utils/response';
import { deleteFileFromOSS } from '../oss/deleteService';
import {
  BackboneMemberRecord,
  BackboneMemberWritable,
  BackboneMemberWritableFields,
} from '../types/dbTypes';

/** 合法职务：队长、部长、副部长、部员 */
const VALID_POSITIONS = ['队长', '部长', '副部长', '部员'];

/** 创建骨干成员（校验必填字段、职务合法性、届次内唯一性，自动映射可写字段） */
export const createBackboneMember = async (
  body: Partial<BackboneMemberWritable>
) => {
  const { student_id, dept_id, term_id, position } = body;

  if (!student_id || !dept_id || !term_id) {
    throw {
      status: HTTP_STATUS.BAD_REQUEST,
      message: '学号、部门ID、届次ID不能为空',
    };
  }

  if (position && !VALID_POSITIONS.includes(position)) {
    throw {
      status: HTTP_STATUS.BAD_REQUEST,
      message: `无效的职务类型：${position}`,
    };
  }

  // 校验届次内唯一性
  const [exists]: any = await query(
    `SELECT member_id FROM backbone_members WHERE student_id = ? AND term_id = ?`,
    [student_id, term_id]
  );
  if (exists) {
    throw {
      status: HTTP_STATUS.CONFLICT,
      message: '该成员在该届次下已存在',
    };
  }

  // 自动构建插入字段与值
  const columns = BackboneMemberWritableFields.join(', ');
  const placeholders = BackboneMemberWritableFields.map(() => '?').join(', ');
  const values = BackboneMemberWritableFields.map(
    (f) => (body as any)[f] ?? null
  );

  const sql = `
    INSERT INTO backbone_members (${columns})
    VALUES (${placeholders})
  `;

  const result: any = await query(sql, values);

  return {
    member_id: result.insertId,
    ...body,
    position: position || '部员',
  };
};

/** 更新骨干成员（校验职务合法性，支持OSS头像替换，自动过滤可写字段） */
export const updateBackboneMember = async (
  member_id: number,
  body: Partial<BackboneMemberWritable>
) => {
  const [existing]: BackboneMemberRecord[] = await query(
    `SELECT * FROM backbone_members WHERE member_id = ?`,
    [member_id]
  );

  if (!existing) {
    throw {
      status: HTTP_STATUS.NOT_FOUND,
      message: '成员记录不存在',
    };
  }

  // 校验职务合法性
  if (body.position && !VALID_POSITIONS.includes(body.position)) {
    throw {
      status: HTTP_STATUS.BAD_REQUEST,
      message: `无效的职务类型：${body.position}`,
    };
  }

  // 头像替换（删除旧OSS文件）
  if (body.photo_key && body.photo_key !== existing.photo_key) {
    if (existing.photo_key) {
      try {
        await deleteFileFromOSS(existing.photo_key);
      } catch (err) {
        console.warn('⚠️ 删除旧头像失败（不影响更新）:', err);
      }
    }
  }

  // 自动构建更新字段
  const updates: string[] = [];
  const values: any[] = [];

  for (const key of BackboneMemberWritableFields) {
    if (body[key] !== undefined) {
      updates.push(`${key} = ?`);
      values.push((body as any)[key]);
    }
  }

  if (updates.length === 0) {
    throw {
      status: HTTP_STATUS.BAD_REQUEST,
      message: '没有可更新字段',
    };
  }

  const sql = `
    UPDATE backbone_members
    SET ${updates.join(', ')}
    WHERE member_id = ?
  `;

  await query(sql, [...values, member_id]);

  return { message: '骨干成员更新成功' };
};

/** 删除骨干成员（连带删除OSS头像文件） */
export const deleteBackboneMember = async (member_id: number) => {
  const [existing]: BackboneMemberRecord[] = await query(
    `SELECT * FROM backbone_members WHERE member_id = ?`,
    [member_id]
  );

  if (!existing) {
    throw { status: HTTP_STATUS.NOT_FOUND, message: '成员不存在' };
  }

  // 删除OSS头像
  if (existing.photo_key) {
    try {
      await deleteFileFromOSS(existing.photo_key);
    } catch (err) {
      console.warn('⚠️ 删除头像失败（不影响主记录删除）:', err);
    }
  }

  await query(`DELETE FROM backbone_members WHERE member_id = ?`, [member_id]);

  return { message: '骨干成员删除成功' };
};

/** 获取所有骨干成员（关联部门、届次信息，按届次时间+部门ID+职务排序） */
export const getAllBackboneMembers = async () => {
  const sql = `
    SELECT 
      m.*,
      d.dept_name,
      t.term_name,
      t.is_current
    FROM backbone_members m
    LEFT JOIN departments d ON m.dept_id = d.dept_id
    LEFT JOIN team_terms t ON m.term_id = t.term_id
    ORDER BY t.start_date DESC, d.dept_id ASC, m.position ASC;
  `;
  const rows = await query(sql);
  return { total: rows.length, data: rows };
};

/** 按届次-部门分组获取骨干成员（树状结构，供门户展示） */
export const getBackboneTree = async () => {
  const sql = `
    SELECT 
      t.term_id, t.term_name, t.is_current,
      d.dept_id, d.dept_name,
      m.member_id, m.student_id, m.position, m.photo_url, m.term_start, m.term_end
    FROM team_terms t
    LEFT JOIN backbone_members m ON t.term_id = m.term_id
    LEFT JOIN departments d ON m.dept_id = d.dept_id
    ORDER BY t.start_date DESC, d.dept_id ASC;
  `;

  const rows: any[] = await query(sql);
  const termMap: Record<number, any> = {};

  for (const row of rows) {
    if (!termMap[row.term_id]) {
      termMap[row.term_id] = {
        term_id: row.term_id,
        term_name: row.term_name,
        is_current: row.is_current,
        departments: {},
      };
    }

    const t = termMap[row.term_id];

    if (row.dept_id && !t.departments[row.dept_id]) {
      t.departments[row.dept_id] = {
        dept_id: row.dept_id,
        dept_name: row.dept_name,
        members: [],
      };
    }

    if (row.member_id) {
      t.departments[row.dept_id].members.push({
        member_id: row.member_id,
        student_id: row.student_id,
        position: row.position,
        photo_url: row.photo_url,
        term_start: row.term_start,
        term_end: row.term_end,
      });
    }
  }

  return Object.values(termMap).map((t) => ({
    term_id: t.term_id,
    term_name: t.term_name,
    is_current: t.is_current,
    departments: Object.values(t.departments),
  }));
};

/** 批量创建骨干成员（校验必填字段、职务合法性、届次内唯一性，返回创建/失败详情） */
export const batchCreateBackboneMembers = async (
  members: Partial<BackboneMemberWritable>[]
) => {
  if (!Array.isArray(members) || members.length === 0) {
    throw {
      status: HTTP_STATUS.BAD_REQUEST,
      message: '请求体必须为非空数组',
    };
  }

  const created: any[] = [];
  const failed: any[] = [];

  for (const item of members) {
    const { student_id, dept_id, term_id, position } = item;

    // 校验必填字段
    if (!student_id || !dept_id || !term_id) {
      failed.push({
        student_id,
        reason: '缺少必要字段 student_id/dept_id/term_id',
      });
      continue;
    }

    // 校验职务合法性
    if (position && !VALID_POSITIONS.includes(position)) {
      failed.push({
        student_id,
        reason: `无效的职务类型：${position}`,
      });
      continue;
    }

    try {
      // 校验届次内唯一性
      const [exists]: any = await query(
        `SELECT member_id FROM backbone_members WHERE student_id = ? AND term_id = ?`,
        [student_id, term_id]
      );

      if (exists) {
        failed.push({ student_id, reason: '该成员在该届次下已存在' });
        continue;
      }

      // 自动构建插入字段
      const columns = BackboneMemberWritableFields.join(', ');
      const placeholders = BackboneMemberWritableFields.map(() => '?').join(
        ', '
      );
      const values = BackboneMemberWritableFields.map(
        (f) => (item as any)[f] ?? null
      );

      const sql = `
        INSERT INTO backbone_members (${columns})
        VALUES (${placeholders})
      `;

      const result: any = await query(sql, values);

      created.push({
        member_id: result.insertId,
        ...item,
        position: item.position || '部员',
      });
    } catch (error: any) {
      failed.push({
        student_id,
        reason: error.message || '数据库错误',
      });
    }
  }

  return {
    total: members.length,
    created: created.length,
    failed: failed.length,
    createdList: created,
    failedList: failed,
  };
};