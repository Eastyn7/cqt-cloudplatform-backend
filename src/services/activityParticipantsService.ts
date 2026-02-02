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
    list: rows,
    total: rows.length,
  };
};

/** 学生报名活动（校验报名时间、活动存在、未重复报名、人数限制，自动映射字段） */
export const joinActivity = async (activity_id: number, student_id: string) => {
  // 校验活动存在
  const [activity]: any = await query(
    `SELECT * FROM activities WHERE activity_id = ?`,
    [activity_id]
  );
  if (!activity)
    throw { status: HTTP_STATUS.NOT_FOUND, message: '活动不存在' };

  // 校验是否在报名时间范围内
  const now = new Date();
  if (activity.signup_start_time) {
    const signupStart = new Date(activity.signup_start_time);
    if (now < signupStart) {
      throw {
        status: HTTP_STATUS.BAD_REQUEST,
        message: '报名时间未开始'
      };
    }
  }
  
  if (activity.signup_end_time) {
    const signupEnd = new Date(activity.signup_end_time);
    if (now > signupEnd) {
      throw {
        status: HTTP_STATUS.BAD_REQUEST,
        message: '报名时间已截止'
      };
    }
  }

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

  // 自动构建报名数据（初始状态为待审核）
  const body: ActivityParticipantWritable = {
    activity_id,
    student_id,
    role: '志愿者',
    status: '待审核',
    approved_by: null,
    approval_reason: null,
    approved_at: null,
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

  return { message: '报名成功，等待管理员审核', activity_id, student_id };
};

/** 取消活动报名（仅在报名期间或待审核状态下允许） */
export const cancelActivity = async (
  activity_id: number,
  student_id: string
) => {
  const [existing]: any = await query(
    `SELECT * FROM activity_participants WHERE activity_id = ? AND student_id = ?`,
    [activity_id, student_id]
  );

  if (!existing)
    throw { status: HTTP_STATUS.NOT_FOUND, message: '您未报名该活动' };

  // 如果已同意，不允许取消
  if (existing.status === '已同意') {
    throw {
      status: HTTP_STATUS.BAD_REQUEST,
      message: '申请已被审核同意，无法取消报名。请联系管理员处理。'
    };
  }

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

/** 批量切换签到状态（已签到→未签到，未签到→已签到） */
export const batchToggleSignIn = async (record_ids: number[]) => {
  if (!Array.isArray(record_ids) || record_ids.length === 0) {
    throw {
      status: HTTP_STATUS.BAD_REQUEST,
      message: '请求体必须为非空数组'
    };
  }

  const successList: any[] = [];
  const failedList: any[] = [];

  for (const record_id of record_ids) {
    try {
      const [existing]: any = await query(
        `SELECT record_id, signed_in FROM activity_participants WHERE record_id = ?`,
        [record_id]
      );

      if (!existing) {
        failedList.push({ record_id, reason: '参与记录不存在' });
        continue;
      }

      const newSignedIn = existing.signed_in === 1 ? 0 : 1;

      const result: any = await query(
        `UPDATE activity_participants SET signed_in = ? WHERE record_id = ?`,
        [newSignedIn, record_id]
      );

      if (result.affectedRows === 0) {
        failedList.push({ record_id, reason: '更新失败（无受影响行）' });
        continue;
      }

      successList.push({ record_id, signed_in: newSignedIn });
    } catch (error: any) {
      failedList.push({ record_id, reason: error.message || '数据库错误' });
    }
  }

  return {
    total: record_ids.length,
    success: successList.length,
    failed: failedList.length,
    successList,
    failedList,
    message:
      failedList.length === 0
        ? '全部切换成功'
        : failedList.length === record_ids.length
          ? '全部切换失败'
          : '部分切换成功'
  };
};


// 同步更新用户总服务时长函数（仅计算已审核通过且签到的、已结束活动的时长）
export const recalculateAllServiceHours = async () => {
  const sql = `
    UPDATE auth_info ai
    LEFT JOIN (
        SELECT student_id, SUM(ap.service_hours) AS total_hours
        FROM activity_participants ap
        INNER JOIN activities a ON ap.activity_id = a.activity_id
        WHERE ap.status = '已同意'
          AND ap.signed_in = 1
          AND a.end_time <= NOW()
        GROUP BY student_id
    ) ap ON ai.student_id = ap.student_id
    SET ai.total_hours = COALESCE(ap.total_hours, 0)
  `;
  await query(sql);
};

/**
 * 结算已结束活动的服务时长：
 * - 条件：活动已结束(end_time<=NOW())
 * - 仅对“已同意”且“已签到”的参与者
 * - 将该活动的 service_hours 写入参与记录
 * 使用场景：定时任务或手动结算后再调用 recalculateAllServiceHours()
 */
export const settleEndedActivitiesServiceHours = async () => {
  const sql = `
    UPDATE activity_participants ap
    INNER JOIN activities a ON ap.activity_id = a.activity_id
    SET ap.service_hours = a.service_hours
    WHERE a.end_time <= NOW()
      AND ap.status = '已同意'
      AND ap.signed_in = 1
  `;

  const result: any = await query(sql);
  await recalculateAllServiceHours();

  return {
    updatedParticipants: result?.affectedRows || 0,
  };
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
    list: rows,
    total: rows.length,
  };
};

/** 获取所有活动参与记录（关联活动、学生信息） */
/** 获取所有活动报名记录（分页） */
export const getAllParticipantsPage = async (queryParams: PaginationQuery = {}) => {
  const { page = 1, pageSize = 20, search, activity_name, status, signed_in } = queryParams as any;

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
    conditions.push('(i.name LIKE ? OR p.student_id LIKE ? OR i.college LIKE ?)');
    values.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  if (activity_name) {
    conditions.push('a.activity_name = ?');
    values.push(activity_name);
  }

  if (status) {
    conditions.push('p.status = ?');
    values.push(status);
  }

  if (signed_in !== undefined && signed_in !== null && signed_in !== '') {
    conditions.push('p.signed_in = ?');
    values.push(Number(signed_in));
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
    list: rows,
    total: rows.length,
  };
};

/** 管理员审核参与者报名申请 */
export const approveParticipant = async (
  record_id: number,
  approved: boolean,
  approved_by: string,
  approval_reason?: string
) => {
  const [existing]: any = await query(
    `SELECT * FROM activity_participants WHERE record_id = ?`,
    [record_id]
  );

  if (!existing)
    throw { status: HTTP_STATUS.NOT_FOUND, message: '参与记录不存在' };

  if (existing.status !== '待审核') {
    throw {
      status: HTTP_STATUS.BAD_REQUEST,
      message: '该申请已审核，不能重复操作'
    };
  }

  const newStatus = approved ? '已同意' : '已拒绝';

  await query(
    `UPDATE activity_participants 
     SET status = ?, approved_by = ?, approval_reason = ?, approved_at = NOW()
     WHERE record_id = ?`,
    [newStatus, approved_by, approval_reason || null, record_id]
  );

  return {
    message: approved ? '申请已同意' : '申请已拒绝',
    record_id,
    status: newStatus
  };
};

/** 批量审核参与者报名申请 */
export const batchApproveParticipants = async (
  approvals: { record_id: number; approved: boolean; approval_reason?: string }[],
  approved_by: string
) => {
  if (!Array.isArray(approvals) || approvals.length === 0) {
    throw {
      status: HTTP_STATUS.BAD_REQUEST,
      message: '请求体必须为非空数组'
    };
  }

  const successList: any[] = [];
  const failedList: any[] = [];

  for (const item of approvals) {
    const { record_id, approved, approval_reason } = item;

    if (!record_id || typeof approved !== 'boolean') {
      failedList.push({
        record_id,
        reason: '缺少 record_id 或 approved 无效'
      });
      continue;
    }

    try {
      await approveParticipant(record_id, approved, approved_by, approval_reason);
      successList.push({ record_id, status: approved ? '已同意' : '已拒绝' });
    } catch (error: any) {
      failedList.push({
        record_id,
        reason: error.message || '审核失败'
      });
    }
  }

  // 重新计算所有用户总时长
  return {
    total: approvals.length,
    success: successList.length,
    failed: failedList.length,
    successList,
    failedList,
    message:
      failedList.length === 0
        ? '全部审核成功'
        : failedList.length === approvals.length
          ? '全部审核失败'
          : '部分审核成功'
  };
};