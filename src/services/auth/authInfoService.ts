import { query } from '../../db';
import {
  AuthInfoRecord,
  AuthInfoWritable,
  AuthInfoWritableFields
} from '../../types/dbTypes';
import { HTTP_STATUS } from '../../utils/response';
import { OSSConfig } from '../../oss/ossConfig';
import { deleteFileFromOSS } from '../../oss/deleteService';

/** 更新用户信息（支持头像OSS旧文件自动删除，自动映射更新字段） */
export const updateUserInfo = async (
  student_id: string,
  body: Partial<AuthInfoWritable>
) => {
  if (!student_id) {
    throw { status: HTTP_STATUS.BAD_REQUEST, message: '学号不能为空' };
  }

  const [existing]: any = await query(
    `SELECT * FROM auth_info WHERE student_id = ?`,
    [student_id]
  );

  if (!existing) {
    throw { status: HTTP_STATUS.NOT_FOUND, message: '用户信息不存在' };
  }

  // 头像更新时删除OSS旧文件
  if (body.avatar_url && body.avatar_url !== existing.avatar_url) {
    if (existing.avatar_url && existing.avatar_url.startsWith(OSSConfig.baseUrl)) {
      const objectKey = existing.avatar_url.replace(OSSConfig.baseUrl, '');
      try {
        await deleteFileFromOSS(objectKey);
      } catch (err) {
        console.warn('⚠️ 删除旧头像失败（不影响整体更新）:', err);
      }
    }
  }

  // 自动构建更新SQL
  const updates: string[] = [];
  const values: any[] = [];

  for (const field of AuthInfoWritableFields) {
    const value = body[field];
    if (value !== undefined && value !== null) {
      updates.push(`${field} = ?`);
      values.push(value);
    }
  }

  if (updates.length === 0) {
    throw { status: HTTP_STATUS.BAD_REQUEST, message: '没有可更新的字段' };
  }

  const sql = `UPDATE auth_info SET ${updates.join(', ')} WHERE student_id = ?`;
  await query(sql, [...values, student_id]);

  return { message: `用户 ${student_id} 信息更新成功` };
};

/** 查询单个用户信息（关联账号表，返回邮箱、角色等完整信息） */
export const getUserInfo = async (student_id: string) => {
  if (!student_id) {
    throw { status: HTTP_STATUS.BAD_REQUEST, message: '学号不能为空' };
  }

  const sql = `
    SELECT 
      i.student_id,
      i.name,
      i.gender,
      i.college,
      i.major,
      i.phone,
      i.avatar_url,
      i.join_date,
      i.total_hours,
      i.skill_tags,
      i.created_at AS info_created_at,
      i.updated_at AS info_updated_at,
      l.email,
      l.role,
      l.created_at AS account_created_at,
      l.updated_at AS account_updated_at
    FROM auth_info i
    JOIN auth_login l ON i.student_id = l.student_id
    WHERE i.student_id = ?;
  `;

  const [user]: any = await query(sql, [student_id]);

  if (!user) {
    throw { status: HTTP_STATUS.NOT_FOUND, message: '未找到该用户信息' };
  }

  return user;
};

/** 查询所有用户信息（管理员专用，关联账号表基础信息） */
export const getAllUsersInfo = async () => {
  const sql = `
    SELECT 
      i.student_id,
      i.name,
      i.gender,
      i.college,
      i.major,
      i.phone,
      i.avatar_url,
      i.join_date,
      i.total_hours,
      i.skill_tags,
      l.email,
      l.role,
      i.created_at AS info_created_at,
      l.created_at AS account_created_at
    FROM auth_info i
    JOIN auth_login l ON i.student_id = l.student_id
    ORDER BY i.student_id ASC;
  `;

  const rows: any[] = await query(sql);

  return {
    total: rows.length,
    data: rows
  };
};

/** 批量更新用户信息（管理员专用，仅更新已有用户，不新增） */
export const batchImportUsersInfo = async (
  users: Partial<AuthInfoWritable>[]
) => {
  if (!Array.isArray(users) || users.length === 0) {
    throw {
      status: HTTP_STATUS.BAD_REQUEST,
      message: '请求体必须为非空用户信息数组'
    };
  }

  const results: {
    student_id: string;
    status: string;
    reason?: string;
  }[] = [];

  for (const user of users) {
    const student_id = user.student_id;

    if (!student_id) {
      results.push({
        student_id: '未知',
        status: 'failed',
        reason: '缺少学号'
      });
      continue;
    }

    try {
      const [existing]: any = await query(
        `SELECT * FROM auth_info WHERE student_id = ?`,
        [student_id]
      );

      if (!existing) {
        results.push({
          student_id,
          status: 'skipped',
          reason: '用户不存在，未更新'
        });
        continue;
      }

      const updates: string[] = [];
      const values: any[] = [];

      // 自动构建更新字段
      for (const field of AuthInfoWritableFields) {
        const val = user[field];
        if (val !== undefined && val !== null) {
          updates.push(`${field} = ?`);
          values.push(val);
        }
      }

      if (updates.length === 0) {
        results.push({
          student_id,
          status: 'skipped',
          reason: '无可更新字段'
        });
        continue;
      }

      const sql = `UPDATE auth_info SET ${updates.join(', ')} WHERE student_id = ?`;
      await query(sql, [...values, student_id]);

      results.push({ student_id, status: 'updated' });
    } catch (err: any) {
      results.push({
        student_id,
        status: 'failed',
        reason: err.message || '未知错误'
      });
    }
  }

  return {
    message: '批量信息更新完成',
    total: users.length,
    updated: results.filter(r => r.status === 'updated').length,
    skipped: results.filter(r => r.status === 'skipped').length,
    failed: results.filter(r => r.status === 'failed').length,
    details: results
  };
};