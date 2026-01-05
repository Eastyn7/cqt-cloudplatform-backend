import { query } from '../db';
import dayjs from 'dayjs';
import {
  EmailVerificationCodeRecord,
  EmailVerificationCodeWritable,
  EmailVerificationCodeWritableFields
} from '../types/dbTypes';
import { sendVerificationCode as sendCodeEmail } from '../utils/emailUtil';
import { PaginationQuery } from '../types/requestTypes';

/** 生成6位随机数字验证码 */
const generateCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/** 验证码有效期（5分钟） */
const CODE_EXPIRE_MINUTES = 5;

/** 检查邮箱同类型验证码是否过1分钟冷却时间 */
export const canSendCode = async (
  email: string,
  type: string
): Promise<boolean> => {
  const sql = `
    SELECT created_at
    FROM email_verification_codes
    WHERE email = ? AND type = ?
    ORDER BY created_at DESC
    LIMIT 1
  `;
  const rows: EmailVerificationCodeRecord[] = await query(sql, [email, type]);

  if (rows.length === 0) return true;

  const lastSendTime = dayjs(rows[0].created_at);
  return dayjs().diff(lastSendTime, 'second') > 60;
};

/** 发送邮箱验证码（含1分钟限流、存储验证码、发送邮件） */
export const sendVerificationCodeService = async (
  email: string,
  type = 'register'
) => {
  // 限流校验
  const canSend = await canSendCode(email, type);
  if (!canSend) throw new Error('发送过于频繁，请稍后再试');

  // 生成验证码与过期时间
  const code = generateCode();
  const expiresAt = dayjs()
    .add(CODE_EXPIRE_MINUTES, 'minute')
    .format('YYYY-MM-DD HH:mm:ss');

  // 构造入库数据
  const body: EmailVerificationCodeWritable = {
    email,
    code,
    type,
    expires_at: expiresAt,
    verified: 0
  };

  // 自动映射字段插入数据库
  const fields = EmailVerificationCodeWritableFields;
  const values = fields.map((f) => body[f] ?? null);

  const sql = `
    INSERT INTO email_verification_codes (${fields.join(', ')})
    VALUES (${fields.map(() => '?').join(', ')})
  `;

  await query(sql, values);

  // 发送邮件
  await sendCodeEmail(email, code);

  return { message: '验证码已发送' };
};

/** 验证邮箱验证码（校验有效性、过期时间，验证通过更新状态） */
export const verifyCodeService = async (
  email: string,
  code: string,
  type = 'register'
): Promise<boolean> => {
  const sql = `
    SELECT *
    FROM email_verification_codes
    WHERE email = ? AND type = ?
    ORDER BY created_at DESC
    LIMIT 1
  `;
  const rows: EmailVerificationCodeRecord[] = await query(sql, [email, type]);

  if (rows.length === 0) return false;

  const latestCode = rows[0];

  // 过期检查
  if (dayjs().isAfter(dayjs(latestCode.expires_at))) return false;

  // 验证码匹配检查
  if (latestCode.code !== code) return false;

  // 更新为已验证状态
  await query(
    `UPDATE email_verification_codes SET verified = 1 WHERE id = ?`,
    [latestCode.id]
  );

  return true;
};

/** 清理过期或已验证的验证码记录（支持按天数清理或默认清理过期/已验证记录） */
export const cleanupVerificationCodesService = async (
  daysBefore?: number
): Promise<number> => {
  let sql: string;
  let params: any[] = [];

  if (daysBefore) {
    sql = `
      DELETE FROM email_verification_codes
      WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)
    `;
    params = [daysBefore];
  } else {
    sql = `
      DELETE FROM email_verification_codes
      WHERE expires_at < NOW() OR verified = 1
    `;
  }

  const result: any = await query(sql, params);

  return result?.affectedRows ?? result?.changes ?? 0;
};

/** 分页查询验证码列表 */
export const getVerificationCodesPage = async (
  queryParams: PaginationQuery = {}
) => {
  const {
    page = 1,
    pageSize = 20,
    search,
    type,
    verified,
  } = queryParams as any;

  const pageNum = Number(page) || 1;
  const sizeNum = Number(pageSize) || 20;

  const conditions: string[] = [];
  const values: any[] = [];

  // search：模糊匹配邮箱
  if (search) {
    conditions.push('email LIKE ?');
    values.push(`%${search}%`);
  }

  // 验证码类型
  if (type) {
    conditions.push('type = ?');
    values.push(type);
  }

  // 验证状态
  if (verified !== undefined && verified !== null && verified !== '') {
    conditions.push('verified = ?');
    values.push(Number(verified));
  }

  const whereSQL = conditions.length
    ? `WHERE ${conditions.join(' AND ')}`
    : '';

  // 统计总数
  const countSql = `
    SELECT COUNT(*) as total
    FROM email_verification_codes
    ${whereSQL}
  `;
  const [{ total }] = (await query(countSql, values)) as any[];

  // 分页查询
  const sql = `
    SELECT *
    FROM email_verification_codes
    ${whereSQL}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `;

  values.push(sizeNum, (pageNum - 1) * sizeNum);
  const rows: EmailVerificationCodeRecord[] = await query(sql, values);

  return {
    list: rows,
    pagination: {
      page: pageNum,
      pageSize: sizeNum,
      total,
    },
  };
};