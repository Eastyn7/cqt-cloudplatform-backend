import { query } from '../db';
import { HTTP_STATUS } from '../utils/response';
import { deleteFileFromOSS } from '../oss/deleteService';
import {
  BackboneMemberRecord,
  BackboneMemberWritable,
  BackboneMemberWritableFields,
} from '../types/dbTypes';
import { PaginationQuery } from '../types/requestTypes';

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

/** 获取所有骨干成员（分页） */
export const getAllBackboneMembersPage = async (queryParams: PaginationQuery = {}) => {
  const { page = 1, pageSize = 20, search } = queryParams;

  const pageNum = Number(page) || 1;
  const sizeNum = Number(pageSize) || 20;

  let sql = `
    SELECT 
      m.member_id,
      m.student_id,
      a.name AS student_name,

      m.position,
      m.photo_key,
      m.term_start,
      m.term_end,
      m.remark,
      m.created_at,
      m.updated_at,

      -- 部门信息
      d.dept_id,
      d.dept_name,
      d.display_order,

      -- 部门负责人（部长）
      l.name AS leader_name,

      -- 上级负责人（队长/总队长）
      mgr.name AS manager_name,

      -- 届次信息
      t.term_id,
      t.term_name,
      t.is_current,
      t.start_date
    FROM backbone_members m
    LEFT JOIN auth_info a ON m.student_id = a.student_id
    LEFT JOIN departments d ON m.dept_id = d.dept_id
    LEFT JOIN auth_info l ON d.leader_id = l.student_id          -- 部长
    LEFT JOIN auth_info mgr ON d.manager_id = mgr.student_id     -- 队长
    LEFT JOIN team_terms t ON m.term_id = t.term_id
  `;

  const conditions: string[] = [];
  const values: any[] = [];

  if (search) {
    conditions.push('(a.name LIKE ? OR m.student_id LIKE ? OR d.dept_name LIKE ? OR m.position LIKE ? OR t.term_name LIKE ?)');
    values.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }

  const whereSQL = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  // 统计总数
  const countSql = `SELECT COUNT(*) as total FROM backbone_members m ${whereSQL.replace(/LEFT JOIN.*ON.*\n/g, '')}`;
  const [{ total }] = await query(countSql, values) as any[];

  // 分页查询
  sql += ` ${whereSQL} ORDER BY 
      t.start_date DESC,
      d.display_order DESC,
      d.dept_id ASC,
      -- 先排队长所在部门（如果当前成员就是队长，则排最前）
      (d.manager_id = m.student_id) DESC,
      FIELD(m.position, '队长', '部长', '副部长', '部员'),
      m.created_at ASC
    LIMIT ? OFFSET ?`;
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

/** 获取所有骨干成员（全量） */
export const getAllBackboneMembers = async () => {
  const sql = `
    SELECT 
      m.member_id,
      m.student_id,
      a.name AS student_name,

      m.position,
      m.photo_key,
      m.term_start,
      m.term_end,
      m.remark,
      m.created_at,
      m.updated_at,

      -- 部门信息
      d.dept_id,
      d.dept_name,
      d.display_order,

      -- 部门负责人（部长）
      l.name AS leader_name,

      -- 上级负责人（队长/总队长）
      mgr.name AS manager_name,

      -- 届次信息
      t.term_id,
      t.term_name,
      t.is_current,
      t.start_date
    FROM backbone_members m
    LEFT JOIN auth_info a ON m.student_id = a.student_id
    LEFT JOIN departments d ON m.dept_id = d.dept_id
    LEFT JOIN auth_info l ON d.leader_id = l.student_id          -- 部长
    LEFT JOIN auth_info mgr ON d.manager_id = mgr.student_id     -- 队长
    LEFT JOIN team_terms t ON m.term_id = t.term_id
    ORDER BY 
      t.start_date DESC,
      d.display_order DESC,
      d.dept_id ASC,
      -- 先排队长所在部门（如果当前成员就是队长，则排最前）
      (d.manager_id = m.student_id) DESC,
      FIELD(m.position, '队长', '部长', '副部长', '部员'),
      m.created_at ASC
  `;

  const rows = await query(sql);

  return {
    total: rows.length,
    data: rows,
  };
};

/** 树形视图专用：按届次 → 队长分组 → 部门 → 成员（最适合组织架构图！） */
export const getBackboneTree = async () => {
  const sql = `
    SELECT 
      t.term_id,
      t.term_name,
      t.is_current,
      t.start_date,

      -- 队长信息（用于分组展示）
      d.manager_id,
      mgr.name AS manager_name,
      mgr.student_id AS manager_student_id,

      -- 部门信息
      d.dept_id,
      d.dept_name,
      d.display_order,

      -- 成员信息
      m.member_id,
      m.student_id,
      COALESCE(a.name, m.student_id) AS student_name,
      m.position,
      m.photo_key,
      m.term_start,
      m.term_end,

      -- 部长姓名（用于在部门下显示“部长：XXX”）
      l.name AS leader_name
    FROM team_terms t
    LEFT JOIN backbone_members m ON t.term_id = m.term_id
    LEFT JOIN departments d ON m.dept_id = d.dept_id
    LEFT JOIN auth_info a ON m.student_id = a.student_id
    LEFT JOIN auth_info l ON d.leader_id = l.student_id          -- 部长
    LEFT JOIN auth_info mgr ON d.manager_id = mgr.student_id     -- 队长
    WHERE m.member_id IS NOT NULL
    ORDER BY 
      t.start_date DESC,
      -- 关键：先按队长排序（同一个队长管多个部门时会聚在一起）
      COALESCE(d.manager_id, '______') ASC,
      d.display_order DESC,
      d.dept_id ASC,
      (m.student_id = d.manager_id) DESC,  -- 队长本人在其负责的第一个部门最前面
      FIELD(m.position, '队长', '部长', '副部长', '部员'),
      m.created_at ASC;
  `;

  const rows: any[] = await query(sql);

  const termMap: Record<number, any> = {};

  for (const row of rows) {
    if (!termMap[row.term_id]) {
      termMap[row.term_id] = {
        term_id: row.term_id,
        term_name: row.term_name,
        is_current: !!row.is_current,
        start_date: row.start_date,
        managers: {},  // 新增：按队长分组
      };
    }

    const term = termMap[row.term_id];
    const managerId = row.manager_id || 'no_manager'; // 没有队长的部门归到“其他”

    // 初始化队长分组
    if (!term.managers[managerId]) {
      term.managers[managerId] = {
        manager_student_id: row.manager_student_id,
        manager_name: row.manager_name || '未设置队长',
        departments: {},
      };
    }

    const managerGroup = term.managers[managerId];

    // 初始化部门
    if (!managerGroup.departments[row.dept_id]) {
      managerGroup.departments[row.dept_id] = {
        dept_id: row.dept_id,
        dept_name: row.dept_name || '未设置部门',
        leader_name: row.leader_name || '暂无部长',
        members: [],
      };
    }

    const dept = managerGroup.departments[row.dept_id];

    // 推入成员
    dept.members.push({
      member_id: row.member_id,
      student_id: row.student_id,
      student_name: row.student_name,
      position: row.position || '部员',
      photo_key: row.photo_key,
      is_manager: row.student_id === row.manager_id,  // 标记此人是否是队长
      term_start: row.term_start,
      term_end: row.term_end,
    });
  }

  // 转为数组并排序：有队长的排前面
  return Object.values(termMap).map((term: any) => ({
    ...term,
    managers: Object.values(term.managers)
      .sort((a: any, b: any) =>
        (a.manager_student_id ? 0 : 1) - (b.manager_student_id ? 0 : 1)
      )
      .map((mgr: any) => ({
        ...mgr,
        departments: Object.values(mgr.departments),
      })),
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