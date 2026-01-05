import { query } from '../db';
import { HTTP_STATUS } from '../utils/response';
import {
  TeamRecruitmentWritable,
  TeamRecruitmentWritableFields,
  TeamRecruitmentRecord,
} from '../types/dbTypes';
import { getCurrentSeason } from './recruitmentSeasonsService';
import { PaginationQuery } from '../types/requestTypes';

/** 用户提交报名 */
export const submitApply = async (
  studentId: string,
  // 使用更严格的创建负载类型：前端必须传入必填字段，后端自动填充 year/recruitment_type 等
  body: Omit<
    TeamRecruitmentWritable,
    | 'year'
    | 'interview_rounds'
    | 'student_id'
    | 'status'
    | 'final_department'
    | 'final_position'
    | 'reviewed_by_stage1'
    | 'review_remark_stage1'
    | 'reviewed_by_stage2'
    | 'review_remark_stage2'
    | 'assigned_by'
  >
) => {
  // 1. 校验当前报名通道
  const season = await getCurrentSeason();
  if (!season) {
    throw { status: HTTP_STATUS.FORBIDDEN, message: '当前无开放报名通道' };
  }
  if (body.recruitment_type && body.recruitment_type !== season.type) {
    throw {
      status: HTTP_STATUS.FORBIDDEN,
      message: `当前仅开放${season.type === 'new_student' ? '新生纳新' : '换届竞选'}`,
    };
  }

  // 2. 防止已是正式成员
  const [isMember] = await query<any[]>('SELECT 1 FROM backbone_members WHERE student_id = ? LIMIT 1', [studentId]);
  if (isMember) {
    throw { status: HTTP_STATUS.FORBIDDEN, message: '您已是志愿队成员，无需报名' };
  }

  // 3. 防止重复报名
  const [exist] = await query<any[]>(
    `SELECT 1 FROM team_recruitment WHERE year = ? AND student_id = ?`,
    [season.year, studentId]
  );
  if (exist) {
    throw { status: HTTP_STATUS.CONFLICT, message: '您已提交过本年度报名' };
  }

  // 4. 换届必填字段校验（前端已控，这里再保险）
  if (season.type === 'internal_election') {
    if (!body.current_position?.trim() || !body.election_position?.trim() || !body.work_plan?.trim()) {
      throw {
        status: HTTP_STATUS.BAD_REQUEST,
        message: '换届竞选需填写当前职务、竞选职务和工作计划',
      };
    }
  }

  // 公共必填字段校验（前端应当保证，但后端再次校验以避免数据库写入 null）
  const requiredFieldsForAll = [
    'name',
    'gender',
    'college',
    'major',
    'grade',
    'phone',
    'email',
    'intention_dept1',
  ];

  for (const f of requiredFieldsForAll) {
    const val = (body as any)[f];
    if (val === undefined || val === null || (typeof val === 'string' && val.trim() === '')) {
      throw { status: HTTP_STATUS.BAD_REQUEST, message: `${f} 为必填项` };
    }
  }

  // 5. 自动填充必要字段 + 构建可写数据
  const data: TeamRecruitmentWritable = {
    year: season.year,
    recruitment_type: season.type,
    interview_rounds: season.type === 'internal_election' ? 1 : 2,
    student_id: studentId,

    name: body.name,
    gender: body.gender,
    college: body.college,
    major: body.major,
    grade: body.grade,
    phone: body.phone,
    email: body.email,
    qq: body.qq ?? null,
    dormitory: body.dormitory ?? null,

    intention_dept1: body.intention_dept1,
    intention_dept2: body.intention_dept2 ?? null,
    current_position: body.current_position ?? null,
    election_position: body.election_position ?? null,
    work_plan: body.work_plan ?? null,

    self_intro: body.self_intro ?? null,
    past_experience: body.past_experience ?? null,
    reason_for_joining: body.reason_for_joining ?? null,
    skill_tags: body.skill_tags ? JSON.stringify(body.skill_tags) : null,

    // 初始状态
    status: 'pending_review',
    final_department: null,
    final_position: null,
    reviewed_by_stage1: null,
    review_remark_stage1: null,
    reviewed_by_stage2: null,
    review_remark_stage2: null,
    assigned_by: null,
  };

  // 自动构建 SQL
  const fields = TeamRecruitmentWritableFields;

  const values = fields.map(f => ((data as any)[f] ?? null));
  const placeholders = fields.map(() => '?').join(', ');

  const sql = `INSERT INTO team_recruitment (${fields.join(', ')}) VALUES (${placeholders})`;

  await query(sql, values);

  return { message: '报名提交成功，请耐心等待审核' };
};

/** 超级管理员获取所有的分页列表 */
export const getAdminPage = async (filters: any) => {
  const {
    year,
    type,
    status,
    page = 1,
    pageSize = 20,
    search,
  } = filters;

  const currentSeason = await getCurrentSeason();
  const targetYear = year || currentSeason?.year;
  if (!targetYear) {
    throw { status: HTTP_STATUS.BAD_REQUEST, message: '请指定年份或当前无开放报名' };
  }

  let sql = `SELECT 
               r.*,
               i.avatar_key,
               i.join_date
             FROM team_recruitment r
             LEFT JOIN auth_info i ON r.student_id = i.student_id
             WHERE r.year = ?`;
  const params: any[] = [targetYear];

  if (type) { sql += ' AND r.recruitment_type = ?'; params.push(type); }
  if (status) { sql += ' AND r.status = ?'; params.push(status); }
  if (search) {
    sql += ' AND (r.student_id LIKE ? OR r.name LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  // 总数
  const countSql = `SELECT COUNT(*) as total FROM team_recruitment WHERE year = ?`;
  const [{ total }] = await query(countSql, [targetYear]) as any[];

  // 数据 + 分页
  sql += ' ORDER BY r.created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(pageSize), (Number(page) - 1) * Number(pageSize));

  const list = await query(sql, params) as TeamRecruitmentRecord[];

  return {
    list,
    pagination: {
      page: Number(page),
      pageSize: Number(pageSize),
      total,
    },
    year: targetYear,
  };
};

/** 审核面试结果（保持简洁） */
export const reviewStage = async (adminId: number, body: any) => {
  const { year, student_ids, stage, pass, remark } = body;

  const targetStatus = pass
    ? stage === '1' ? 'interview1_passed' : 'interview2_passed'
    : stage === '1' ? 'interview1_failed' : 'interview2_failed';

  const reviewerField = stage === '1' ? 'reviewed_by_stage1' : 'reviewed_by_stage2';
  const remarkField = stage === '1' ? 'review_remark_stage1' : 'review_remark_stage2';

  await query(
    `UPDATE team_recruitment
     SET status = ?, ${reviewerField} = ?, ${remarkField} = ?, updated_at = NOW()
     WHERE year = ? AND student_id IN (?)`,
    [targetStatus, adminId, remark || null, year, student_ids]
  );

  // 换届一轮通过直接待任命
  if (pass && stage === '1') {
    await query(
      `UPDATE team_recruitment SET status = 'pending_assignment'
       WHERE year = ? AND student_id IN (?) AND interview_rounds = 1`,
      [year, student_ids]
    );
  }

  // 新生复试通过 → 待分配
  if (pass && stage === '2') {
    await query(
      `UPDATE team_recruitment SET status = 'pending_assignment'
       WHERE year = ? AND student_id IN (?)`,
      [year, student_ids]
    );
  }

  return { message: `成功${pass ? '通过' : '淘汰'}${student_ids.length}人` };
};

/** 最终任命/分配部门 */
export const assignFinal = async (adminId: number, body: any) => {
  const { year, student_ids, department, position = '队员' } = body;

  await query('START TRANSACTION');
  try {
    await query(
      `UPDATE team_recruitment
       SET status = 'assigned',
           final_department = ?,
           final_position = ?,
           assigned_by = ?
       WHERE year = ? AND student_id IN (?) AND status = 'pending_assignment'`,
      [department, position, adminId, year, student_ids]
    );

    for (const sid of student_ids) {
      const [info] = await query<any[]>('SELECT name FROM auth_info WHERE student_id = ?', [sid]);
      if (!info) continue;

      await query(
        `INSERT IGNORE INTO backbone_members
         (student_id, name, department_id, position, term_start)
         VALUES (?, ?, (SELECT id FROM departments WHERE name = ?), ?, CURDATE())`,
        [sid, info.name, department, position]
      );

      await query(`UPDATE auth_info SET join_date = CURDATE() WHERE student_id = ?`, [sid]);
    }

    await query('COMMIT');
    return { message: `成功任命/录取 ${student_ids.length} 人至 ${department}` };
  } catch (err) {
    await query('ROLLBACK');
    throw { status: HTTP_STATUS.INTERNAL_ERROR, message: '操作失败' };
  }
};

/** 获取某部门管理员负责部门下的所有报名（分页） */
export const getDepartmentApplicants = async (adminStudentId: string, year?: number, queryParams: PaginationQuery = {}) => {
  const { page = 1, pageSize = 20, search } = queryParams;

  const pageNum = Number(page) || 1;
  const sizeNum = Number(pageSize) || 20;

  const currentSeason = await getCurrentSeason();
  const targetYear = year || currentSeason?.year;
  if (!targetYear) {
    throw { status: HTTP_STATUS.BAD_REQUEST, message: '请指定年份或当前无开放报名' };
  }

  // 找到该管理员负责的部门（manager_id 或 leader_id）
  const deps = await query(`SELECT dept_name FROM departments WHERE manager_id = ? OR leader_id = ?`, [adminStudentId, adminStudentId]) as { dept_name: string }[];
  if (!deps || deps.length === 0) {
    return {
      list: [],
      year: targetYear,
      pagination: {
        page: pageNum,
        pageSize: sizeNum,
        total: 0,
      },
    };
  }

  const deptNames = deps.map(d => d.dept_name);

  let sql = `SELECT r.*, i.avatar_key, i.join_date
             FROM team_recruitment r
             LEFT JOIN auth_info i ON r.student_id = i.student_id
             WHERE r.year = ? AND r.intention_dept1 IN (?)`;

  const conditions: string[] = [];
  const values: any[] = [targetYear, deptNames];

  if (search) {
    conditions.push('(r.student_id LIKE ? OR r.name LIKE ?)');
    values.push(`%${search}%`, `%${search}%`);
  }

  const whereSQL = conditions.length ? ` AND ${conditions.join(' AND ')}` : '';

  // 统计总数
  const countSql = `SELECT COUNT(*) as total FROM team_recruitment r WHERE r.year = ? AND r.intention_dept1 IN (?) ${whereSQL}`;
  const [{ total }] = await query(countSql, [targetYear, deptNames, ...values.slice(2)]) as any[];

  // 分页查询
  sql += ` ${whereSQL} ORDER BY r.created_at DESC LIMIT ? OFFSET ?`;
  values.push(sizeNum, (pageNum - 1) * sizeNum);

  const rows = await query(sql, values) as TeamRecruitmentRecord[];

  return {
    list: rows,
    year: targetYear,
    pagination: {
      page: pageNum,
      pageSize: sizeNum,
      total,
    },
  };
};