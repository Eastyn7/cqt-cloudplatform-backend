import { query } from '../db';
import { HTTP_STATUS } from '../utils/response';
import {
  ActivityParticipantRecord,
  ActivityParticipantWritable,
  ActivityParticipantWritableFields
} from '../types/dbTypes';
import { PaginationQuery } from '../types/requestTypes';

/** 获取活动报名名单（分页） */
export const getParticipantsByActivityPage = async (activity_id: number, queryParams: any = {}) => {
  const { page = 1, pageSize = 20, search } = queryParams;

  const pageNum = Number(page) || 1;
  const sizeNum = Number(pageSize) || 20;

  let sql = `
    SELECT 
      p.*, a.activity_name, i.name AS student_name, i.college, i.major
    FROM activity_participants p
    LEFT JOIN activities a ON p.activity_id = a.activity_id
    LEFT JOIN auth_info i ON p.student_id = i.student_id
    WHERE p.activity_id = ?
  `;

  const conditions: string[] = [];
  const values: any[] = [activity_id];

  if (search) {
    conditions.push('(i.name LIKE ? OR p.student_id LIKE ?)');
    values.push(`%${search}%`, `%${search}%`);
  }

  const whereSQL = conditions.length ? ` AND ${conditions.join(' AND ')}` : '';

  // 统计总数
  const countSql = `SELECT COUNT(*) as total FROM activity_participants p LEFT JOIN activities a ON p.activity_id = a.activity_id LEFT JOIN auth_info i ON p.student_id = i.student_id WHERE p.activity_id = ? ${whereSQL}`;
  const [{ total }] = await query(countSql, values) as any[];

  // 分页查询
  sql += ` ${whereSQL} ORDER BY p.record_id ASC LIMIT ? OFFSET ?`;
  values.push(sizeNum, (pageNum - 1) * sizeNum);

  const rows: any[] = await query(sql, values);

  return {
    list: rows,
    pagination: {
      page: pageNum,
      pageSize: sizeNum,
      total,
    },
  };
};

/** 获取活动报名名单（全量） */
export const getAllParticipantsByActivity = async (activity_id: number) => {
  const sql = `
    SELECT 
      p.*, a.activity_name, i.name AS student_name, i.college, i.major
    FROM activity_participants p
    LEFT JOIN activities a ON p.activity_id = a.activity_id
    LEFT JOIN auth_info i ON p.student_id = i.student_id
    WHERE p.activity_id = ?
    ORDER BY p.record_id ASC
  `;

  const rows: any[] = await query(sql, [activity_id]);

  return {
    total: rows.length,
    data: rows,
  };
};

/** 学生报名活动（校验活动存在、未重复报名、人数限制，自动映射字段） */
export const joinActivity = async (activity_id: number, student_id: string) => {
  // 校验活动存在
  const [activity]: any = await query(
    `SELECT * FROM activities WHERE activity_id = ?`,
    [activity_id]
  );
  if (!activity)
    throw { status: HTTP_STATUS.NOT_FOUND, message: '活动不存在' };

  // 校验未重复报名
  const [existing]: any = await query(
    `SELECT * FROM activity_participants WHERE activity_id = ? AND student_id = ?`,
    [activity_id, student_id]
  );
  if (existing)
    throw {
      status: HTTP_STATUS.BAD_REQUEST,
      message: '您已报名该活动'
    };

  // 校验人数限制
  if (activity.recruitment_limit) {
    const [{ count }]: any = await query(
      `SELECT COUNT(*) AS count FROM activity_participants WHERE activity_id = ?`,
      [activity_id]
    );
    if (count >= activity.recruitment_limit)
      throw {
        status: HTTP_STATUS.BAD_REQUEST,
        message: '报名人数已满'
      };
  }

  // 自动构建报名数据
  const body: ActivityParticipantWritable = {
    activity_id,
    student_id,
    role: '志愿者',
    service_hours: 0,
    signed_in: 0,
    remark: null
  };

  const fields = ActivityParticipantWritableFields;
  const placeholders = fields.map(() => '?').join(', ');
  const values = fields.map(key => body[key] ?? null);

  const sql = `
    INSERT INTO activity_participants (${fields.join(', ')})
    VALUES (${placeholders})
  `;

  await query(sql, values);

  return { message: '报名成功', activity_id, student_id };
};

/** 取消活动报名 */
export const cancelActivity = async (
  activity_id: number,
  student_id: string
) => {
  const [existing]: any = await query(
    `SELECT record_id FROM activity_participants WHERE activity_id = ? AND student_id = ?`,
    [activity_id, student_id]
  );

  if (!existing)
    throw { status: HTTP_STATUS.NOT_FOUND, message: '您未报名该活动' };

  await query(
    `DELETE FROM activity_participants WHERE activity_id = ? AND student_id = ?`,
    [activity_id, student_id]
  );

  return { message: '取消报名成功', activity_id, student_id };
};

/** 活动签到/取消签到（1=签到，0=取消） */
export const markSignIn = async (record_id: number, signed_in: 0 | 1) => {
  const [existing]: any = await query(
    `SELECT * FROM activity_participants WHERE record_id = ?`,
    [record_id]
  );

  if (!existing)
    throw { status: HTTP_STATUS.NOT_FOUND, message: '参与记录不存在' };

  await query(
    `UPDATE activity_participants SET signed_in = ? WHERE record_id = ?`,
    [signed_in, record_id]
  );

  return { message: signed_in ? '签到成功' : '签到状态取消' };
};


// 同步更新用户总服务时长函数
export const recalculateAllServiceHours = async () => {
  const sql = `
    UPDATE auth_info ai
    LEFT JOIN (
        SELECT student_id, SUM(service_hours) AS total_hours
        FROM activity_participants
        GROUP BY student_id
    ) ap ON ai.student_id = ap.student_id
    SET ai.total_hours = COALESCE(ap.total_hours, 0)
  `;
  await query(sql);
};

/** 单个更新志愿者服务时长 */
export const updateServiceHours = async (
  record_id: number,
  service_hours: number
) => {
  const [existing]: any = await query(
    `SELECT * FROM activity_participants WHERE record_id = ?`,
    [record_id]
  );

  if (!existing)
    throw { status: HTTP_STATUS.NOT_FOUND, message: '参与记录不存在' };

  await query(
    `UPDATE activity_participants SET service_hours = ? WHERE record_id = ?`,
    [service_hours, record_id]
  );

  // 同步更新所有人的总服务时长
  await recalculateAllServiceHours();

  return { message: '服务时长更新成功', record_id, service_hours };
};

/** 批量更新志愿者服务时长（返回更新结果详情） */
export const batchUpdateServiceHours = async (
  updates: { record_id: number; service_hours: number }[]
) => {
  if (!Array.isArray(updates) || updates.length === 0) {
    throw {
      status: HTTP_STATUS.BAD_REQUEST,
      message: '请求体必须为非空数组'
    };
  }

  const successList: any[] = [];
  const failedList: any[] = [];

  for (const item of updates) {
    const { record_id, service_hours } = item;

    if (!record_id || typeof service_hours !== 'number') {
      failedList.push({
        record_id,
        reason: '缺少 record_id 或 service_hours 无效'
      });
      continue;
    }

    try {
      const [exists]: any = await query(
        `SELECT record_id FROM activity_participants WHERE record_id = ?`,
        [record_id]
      );

      if (!exists) {
        failedList.push({ record_id, reason: '报名记录不存在' });
        continue;
      }

      const result: any = await query(
        `UPDATE activity_participants SET service_hours = ? WHERE record_id = ?`,
        [service_hours, record_id]
      );

      if (result.affectedRows === 0) {
        failedList.push({
          record_id,
          reason: '更新失败（无受影响行）'
        });
        continue;
      }

      successList.push({ record_id, service_hours });
    } catch (error: any) {
      failedList.push({
        record_id,
        reason: error.message || '数据库错误'
      });
    }
  }
  // 所有 service_hours 已更新
  await recalculateAllServiceHours();

  return {
    total: updates.length,
    success: successList.length,
    failed: failedList.length,
    successList,
    failedList,
    message:
      failedList.length === 0
        ? '全部更新成功（总时长已同步）'
        : failedList.length === updates.length
          ? '全部更新失败'
          : '部分更新成功（总时长已同步）'
  };
};

/** 获取学生个人报名记录（关联活动、个人信息） */
/** 获取学生参与的活动记录（分页） */
export const getRecordsByStudentPage = async (student_id: string, queryParams: PaginationQuery = {}) => {
  const { page = 1, pageSize = 20, search } = queryParams;

  const pageNum = Number(page) || 1;
  const sizeNum = Number(pageSize) || 20;

  let sql = `
    SELECT
      p.*,
      a.activity_name,
      a.start_time,
      a.end_time,
      a.location,
      a.category,
      a.status AS activity_status,
      i.name AS student_name,
      i.college,
      i.major
    FROM activity_participants p
    LEFT JOIN activities a ON p.activity_id = a.activity_id
    LEFT JOIN auth_info i ON p.student_id = i.student_id
    WHERE p.student_id = ?
  `;

  const conditions: string[] = [];
  const values: any[] = [student_id];

  if (search) {
    conditions.push('a.activity_name LIKE ?');
    values.push(`%${search}%`);
  }

  const whereSQL = conditions.length ? ` AND ${conditions.join(' AND ')}` : '';

  // 统计总数
  const countSql = `SELECT COUNT(*) as total FROM activity_participants p LEFT JOIN activities a ON p.activity_id = a.activity_id WHERE p.student_id = ? ${whereSQL}`;
  const [{ total }] = await query(countSql, values) as any[];

  // 分页查询
  sql += ` ${whereSQL} ORDER BY a.start_time DESC LIMIT ? OFFSET ?`;
  values.push(sizeNum, (pageNum - 1) * sizeNum);

  const rows: any[] = await query(sql, values);

  return {
    list: rows,
    pagination: {
      page: pageNum,
      pageSize: sizeNum,
      total,
    },
  };
};

/** 获取学生参与的活动记录（全量） */
export const getRecordsByStudent = async (student_id: string) => {
  const sql = `
    SELECT
      p.*,
      a.activity_name,
      a.start_time,
      a.end_time,
      a.location,
      a.category,
      a.status AS activity_status,
      i.name AS student_name,
      i.college,
      i.major
    FROM activity_participants p
    LEFT JOIN activities a ON p.activity_id = a.activity_id
    LEFT JOIN auth_info i ON p.student_id = i.student_id
    WHERE p.student_id = ?
    ORDER BY a.start_time DESC
  `;

  const rows: any[] = await query(sql, [student_id]);

  return {
    total: rows.length,
    data: rows,
  };
};

/** 获取所有活动参与记录（关联活动、学生信息） */
/** 获取所有活动报名记录（分页） */
export const getAllParticipantsPage = async (queryParams: PaginationQuery = {}) => {
  const { page = 1, pageSize = 20, search } = queryParams;

  const pageNum = Number(page) || 1;
  const sizeNum = Number(pageSize) || 20;

  let sql = `
    SELECT 
      p.*, 
      a.activity_id, 
      a.activity_name, 
      a.start_time, 
      a.end_time, 
      a.location,
      a.category,
      i.name AS student_name, 
      i.college, 
      i.major
    FROM activity_participants p
    LEFT JOIN activities a ON p.activity_id = a.activity_id
    LEFT JOIN auth_info i ON p.student_id = i.student_id
  `;

  const conditions: string[] = [];
  const values: any[] = [];

  if (search) {
    conditions.push('(a.activity_name LIKE ? OR i.name LIKE ? OR p.student_id LIKE ? OR i.college LIKE ?)');
    values.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }

  const whereSQL = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  // 统计总数
  const countSql = `SELECT COUNT(*) as total FROM activity_participants p LEFT JOIN activities a ON p.activity_id = a.activity_id LEFT JOIN auth_info i ON p.student_id = i.student_id ${whereSQL}`;
  const [{ total }] = await query(countSql, values) as any[];

  // 分页查询
  sql += ` ${whereSQL} ORDER BY a.activity_id ASC, p.record_id ASC LIMIT ? OFFSET ?`;
  values.push(sizeNum, (pageNum - 1) * sizeNum);

  const rows: any[] = await query(sql, values);

  return {
    list: rows,
    pagination: {
      page: pageNum,
      pageSize: sizeNum,
      total,
    },
  };
};

/** 获取所有活动报名记录（全量） */
export const getAllParticipants = async () => {
  const sql = `
    SELECT 
      p.*, 
      a.activity_id, 
      a.activity_name, 
      a.start_time, 
      a.end_time, 
      a.location,
      a.category,
      i.name AS student_name, 
      i.college, 
      i.major
    FROM activity_participants p
    LEFT JOIN activities a ON p.activity_id = a.activity_id
    LEFT JOIN auth_info i ON p.student_id = i.student_id
    ORDER BY a.activity_id ASC, p.record_id ASC
  `;

  const rows: any[] = await query(sql);

  return {
    total: rows.length,
    data: rows,
  };
};