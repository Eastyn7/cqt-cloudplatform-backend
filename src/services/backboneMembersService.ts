import { query } from '../db';
import { HTTP_STATUS } from '../utils/response';
import { deleteFileFromOSS } from '../oss/deleteService';
import ExcelJS from 'exceljs';
import {
  BackboneMemberRecord,
  BackboneMemberWritable,
  BackboneMemberWritableFields,
} from '../types/dbTypes';
import { PaginationQuery } from '../types/requestTypes';

interface BackboneMembersPageQuery extends PaginationQuery {
  term_id?: number | string;
  dept_id?: number | string;
  position?: string;
}

interface BackboneMembersFilterResult {
  whereSQL: string;
  whereValues: any[];
}

const BACKBONE_MEMBERS_BASE_FROM_SQL = `
  FROM backbone_members m
  LEFT JOIN auth_info a ON m.student_id = a.student_id
  LEFT JOIN departments d ON m.dept_id = d.dept_id
  LEFT JOIN auth_info l ON d.leader_id = l.student_id          -- 部长
  LEFT JOIN auth_info mgr ON d.manager_id = mgr.student_id     -- 队长
  LEFT JOIN team_terms t ON m.term_id = t.term_id
`;

/** 合法职务：队长、部长、副部长、部员 */
const VALID_POSITIONS = ['队长', '部长', '副部长', '部员'];

const normalizeIdFilter = (
  rawValue: number | string | undefined,
  fieldLabel: string,
  required = false
) => {
  if (rawValue === undefined || rawValue === null || rawValue === '') {
    if (required) {
      throw {
        status: HTTP_STATUS.BAD_REQUEST,
        message: `${fieldLabel}不能为空`,
      };
    }
    return undefined;
  }

  const normalized = Number(rawValue);
  if (!Number.isInteger(normalized) || normalized <= 0) {
    throw {
      status: HTTP_STATUS.BAD_REQUEST,
      message: `${fieldLabel}必须为正整数`,
    };
  }

  return normalized;
};

const buildBackboneMembersWhere = (
  queryParams: BackboneMembersPageQuery,
  requiredTermId = false
): BackboneMembersFilterResult => {
  const { search, term_id, dept_id, position } = queryParams;

  const termIdFilter = normalizeIdFilter(term_id, 'term_id', requiredTermId);
  const deptIdFilter = normalizeIdFilter(dept_id, 'dept_id');

  if (position && !VALID_POSITIONS.includes(position)) {
    throw {
      status: HTTP_STATUS.BAD_REQUEST,
      message: `无效的职务类型：${position}`,
    };
  }

  const conditions: string[] = [];
  const whereValues: any[] = [];

  if (search) {
    conditions.push('(a.name LIKE ? OR m.student_id LIKE ?)');
    whereValues.push(`%${search}%`, `%${search}%`);
  }

  if (termIdFilter !== undefined) {
    conditions.push('m.term_id = ?');
    whereValues.push(termIdFilter);
  }

  if (deptIdFilter !== undefined) {
    conditions.push('m.dept_id = ?');
    whereValues.push(deptIdFilter);
  }

  if (position) {
    conditions.push('m.position = ?');
    whereValues.push(position);
  }

  return {
    whereSQL: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '',
    whereValues,
  };
};

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
export const getAllBackboneMembersPage = async (
  queryParams: BackboneMembersPageQuery = {}
) => {
  const { page = 1, pageSize = 20 } = queryParams;

  const pageNum = Number(page) || 1;
  const sizeNum = Number(pageSize) || 20;
  const { whereSQL, whereValues } = buildBackboneMembersWhere(queryParams);

  const selectSql = `
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
    ${BACKBONE_MEMBERS_BASE_FROM_SQL}
  `;

  // 统计总数
  const countSql = `SELECT COUNT(*) as total ${BACKBONE_MEMBERS_BASE_FROM_SQL} ${whereSQL}`;
  const [{ total }] = (await query(countSql, whereValues)) as any[];

  // 分页查询
  const listSql = `${selectSql} ${whereSQL} ORDER BY 
      t.start_date DESC,
      d.display_order DESC,
      d.dept_id ASC,
      -- 先排队长所在部门（如果当前成员就是队长，则排最前）
      (d.manager_id = m.student_id) DESC,
      FIELD(m.position, '队长', '部长', '副部长', '部员'),
      m.created_at ASC
    LIMIT ? OFFSET ?`;
  const listValues = [...whereValues, sizeNum, (pageNum - 1) * sizeNum];

  const rows = await query(listSql, listValues);

  return {
    list: rows,
    pagination: {
      page: pageNum,
      pageSize: sizeNum,
      total,
    },
  };
};

/** 管理端导出骨干成员（Excel） */
export const exportBackboneMembersExcel = async (
  queryParams: BackboneMembersPageQuery = {}
) => {
  const { whereSQL, whereValues } = buildBackboneMembersWhere(queryParams, true);

  const sql = `
    SELECT
      t.term_name,
      d.dept_name,
      m.position,
      m.student_id,
      COALESCE(a.name, m.student_id) AS student_name,
      a.gender,
      a.college,
      a.major,
      a.phone
    ${BACKBONE_MEMBERS_BASE_FROM_SQL}
    ${whereSQL}
    ORDER BY
      d.display_order DESC,
      d.dept_id ASC,
      FIELD(m.position, '队长', '部长', '副部长', '部员'),
      m.created_at ASC
  `;

  const rows: any[] = await query(sql, whereValues);

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('骨干成员导出');

  const columns = ['姓名', '性别', '部门', '学号', '学院', '专业', '联系方式'];

  const setHeaderRow = (rowIndex: number) => {
    const headerRow = worksheet.getRow(rowIndex);
    headerRow.values = columns;
    headerRow.font = { bold: true };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFEFF5FF' },
      };
    });
  };

  const setDataRow = (rowIndex: number, member: any) => {
    const row = worksheet.getRow(rowIndex);
    row.values = [
      member.student_name || '',
      member.gender || '',
      member.dept_name || '',
      member.student_id || '',
      member.college || '',
      member.major || '',
      member.phone || '',
    ];
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
      cell.alignment = { vertical: 'middle', horizontal: 'left' };
    });
  };

  let currentRow = 1;

  if (rows.length === 0) {
    worksheet.mergeCells(currentRow, 1, currentRow, columns.length);
    const emptyTitleCell = worksheet.getCell(currentRow, 1);
    emptyTitleCell.value = '当前筛选条件下无可导出骨干成员';
    emptyTitleCell.font = { bold: true, size: 14 };
    emptyTitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    currentRow += 2;

    setHeaderRow(currentRow);
  } else {
    const termName = rows[0].term_name || '未知届次';

    worksheet.mergeCells(currentRow, 1, currentRow, columns.length);
    const leadersTitleCell = worksheet.getCell(currentRow, 1);
    leadersTitleCell.value = `${termName} - 队长团`;
    leadersTitleCell.font = { bold: true, size: 13 };
    leadersTitleCell.alignment = { horizontal: 'left', vertical: 'middle' };
    currentRow += 1;

    setHeaderRow(currentRow);
    currentRow += 1;

    const leaders = rows.filter((item) => item.position === '队长');
    if (leaders.length === 0) {
      const noLeaderRow = worksheet.getRow(currentRow);
      noLeaderRow.values = ['暂无队长', '', '', '', '', '', ''];
      currentRow += 1;
    } else {
      for (const leader of leaders) {
        setDataRow(currentRow, leader);
        currentRow += 1;
      }
    }

    currentRow += 1;

    const deptMap = new Map<string, any[]>();
    for (const item of rows) {
      if (item.position === '队长') {
        continue;
      }
      const deptName = item.dept_name || '未分配部门';
      if (!deptMap.has(deptName)) {
        deptMap.set(deptName, []);
      }
      deptMap.get(deptName)!.push(item);
    }

    if (deptMap.size === 0) {
      worksheet.mergeCells(currentRow, 1, currentRow, columns.length);
      const noDeptMembersTitle = worksheet.getCell(currentRow, 1);
      noDeptMembersTitle.value = `${termName} - 各部门成员`;
      noDeptMembersTitle.font = { bold: true, size: 13 };
      noDeptMembersTitle.alignment = { horizontal: 'left', vertical: 'middle' };
      currentRow += 1;

      setHeaderRow(currentRow);
      currentRow += 1;

      const noDeptMembersRow = worksheet.getRow(currentRow);
      noDeptMembersRow.values = ['暂无成员', '', '', '', '', '', ''];
      currentRow += 1;
    }

    for (const [deptName, members] of deptMap.entries()) {
      worksheet.mergeCells(currentRow, 1, currentRow, columns.length);
      const titleCell = worksheet.getCell(currentRow, 1);
      titleCell.value = `${termName} - ${deptName}`;
      titleCell.font = { bold: true, size: 13 };
      titleCell.alignment = { horizontal: 'left', vertical: 'middle' };
      currentRow += 1;

      setHeaderRow(currentRow);
      currentRow += 1;

      if (members.length === 0) {
        const noMembersRow = worksheet.getRow(currentRow);
        noMembersRow.values = ['暂无成员', '', deptName, '', '', '', ''];
        currentRow += 1;
      } else {
        for (const member of members) {
          setDataRow(currentRow, member);
          currentRow += 1;
        }
      }

      currentRow += 1;
    }
  }

  worksheet.columns = [
    { width: 14 },
    { width: 10 },
    { width: 16 },
    { width: 16 },
    { width: 22 },
    { width: 22 },
    { width: 18 },
  ];

  const safeTermForFilename = rows[0]?.term_name
    ? String(rows[0].term_name).replace(/[\\/:*?"<>|]/g, '_')
    : 'unknown-term';
  const fileName = `骨干成员导出-${safeTermForFilename}.xlsx`;

  const buffer = Buffer.from(await workbook.xlsx.writeBuffer());

  return {
    fileName,
    buffer,
    total: rows.length,
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
    list: rows,
    total: rows.length,
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
  const tree = Object.values(termMap).map((term: any) => ({
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

  return {
    list: tree,
    total: tree.length,
  };
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