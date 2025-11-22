import { query } from '../../db';
import { hashPassword, comparePassword } from '../../utils/bcryptUtil';
import { signToken } from '../../utils/tokenUtil';
import { HTTP_STATUS } from '../../utils/response';
import { sendWelcomeEmail, sendPasswordChangedEmail } from '../../utils/emailUtil';
import { AuthLoginRecord, AuthLoginWritable, AuthLoginWritableFields } from '../../types/dbTypes';
import { RegisterRequestBody, LoginRequestBody, ResetPasswordRequestBody } from '../../types/requestTypes';

/** 构建 auth_login 表 INSERT SQL */
const buildInsertSQL = (data: AuthLoginWritable) => {
  const fields = AuthLoginWritableFields;
  const placeholders = fields.map(() => "?").join(",");
  const values = fields.map((key) => data[key]);

  const sql = `INSERT INTO auth_login (${fields.join(",")}) VALUES (${placeholders})`;
  return { sql, values };
};

/** 用户注册（需邮箱验证码校验，仅支持 ctbu.edu.cn 邮箱） */
export const registerUser = async (body: RegisterRequestBody) => {
  const { student_id, email, password, name, code } = body;

  if (!email.endsWith('@ctbu.edu.cn')) {
    throw { status: HTTP_STATUS.BAD_REQUEST, message: '邮箱必须以 @ctbu.edu.cn 结尾' };
  }

  const [existingUser] = await query<AuthLoginRecord[]>(
    'SELECT * FROM auth_login WHERE student_id = ? OR email = ?',
    [student_id, email]
  );

  if (existingUser) {
    throw { status: HTTP_STATUS.CONFLICT, message: '该学号或邮箱已注册' };
  }

  const [verifyRecord] = await query<any[]>(
    `SELECT * FROM email_verification_codes 
     WHERE email = ? AND code = ? AND type = 'register'
     ORDER BY id DESC LIMIT 1`,
    [email, code]
  );

  if (!verifyRecord) {
    throw { status: HTTP_STATUS.BAD_REQUEST, message: '验证码错误或未发送' };
  }

  if (new Date(verifyRecord.expires_at) < new Date()) {
    throw { status: HTTP_STATUS.BAD_REQUEST, message: '验证码已过期' };
  }

  if (verifyRecord.verified === 1) {
    throw { status: HTTP_STATUS.BAD_REQUEST, message: '验证码已被使用，请重新获取' };
  }

  await query(`UPDATE email_verification_codes SET verified = 1 WHERE id = ?`, [
    verifyRecord.id,
  ]);

  const password_hash = await hashPassword(password);

  const writable: AuthLoginWritable = {
    role: 'user',
    student_id,
    email,
    password_hash
  };
  const { sql, values } = buildInsertSQL(writable);
  await query(sql, values);

  await query(`INSERT INTO auth_info (student_id, name) VALUES (?, ?)`, [
    student_id,
    name,
  ]);

  sendWelcomeEmail(email, name);
  return { message: '注册成功' };
};

/** 用户登录（loginInput 支持学号/邮箱） */
export const loginUser = async (body: LoginRequestBody) => {
  const { loginInput, password } = body;

  const [user] = await query<AuthLoginRecord[]>(
    `SELECT * FROM auth_login WHERE email = ? OR student_id = ?`,
    [loginInput, loginInput]
  );

  if (!user) {
    throw { status: HTTP_STATUS.UNAUTHORIZED, message: '用户不存在' };
  }

  const isMatch = await comparePassword(password, user.password_hash);
  if (!isMatch) {
    throw { status: HTTP_STATUS.UNAUTHORIZED, message: '密码错误' };
  }

  const token = signToken({
    auth_id: user.auth_id,
    student_id: user.student_id,
    email: user.email,
    role: user.role,
  });

  return {
    token,
    student_id: user.student_id,
    email: user.email,
  };
};

/** 批量注册用户（管理员专用，无需验证码） */
export const batchRegisterUsers = async (users: RegisterRequestBody[]) => {
  if (!Array.isArray(users) || users.length === 0) {
    throw { status: HTTP_STATUS.BAD_REQUEST, message: '请求体必须为非空数组' };
  }

  const results: { student_id: string; email: string; status: string; reason?: string }[] = [];

  for (const user of users) {
    const { student_id, email, password, name } = user;

    try {
      const [existing] = await query<AuthLoginRecord[]>(
        `SELECT * FROM auth_login WHERE student_id = ? OR email = ?`,
        [student_id, email]
      );

      if (existing) {
        results.push({ student_id, email, status: 'failed', reason: '该学号或邮箱已注册' });
        continue;
      }

      const password_hash = await hashPassword(password);

      const writable: AuthLoginWritable = {
        role: 'user',
        student_id,
        email,
        password_hash,
      };

      const { sql, values } = buildInsertSQL(writable);
      await query(sql, values);

      await query(`INSERT INTO auth_info (student_id, name) VALUES (?, ?)`, [
        student_id,
        name,
      ]);

      results.push({ student_id, email, status: 'success' });
    } catch (err: any) {
      results.push({ student_id, email, status: 'failed', reason: err.message });
    }
  }

  return {
    message: '批量注册完成',
    total: users.length,
    success: results.filter(r => r.status === 'success').length,
    failed: results.filter(r => r.status === 'failed').length,
    details: results,
  };
};

/** 按学号删除单个用户 */
export const deleteUserByStudentId = async (student_id: string) => {
  if (!student_id) {
    throw { status: HTTP_STATUS.BAD_REQUEST, message: '学号不能为空' };
  }

  const [existing]: any = await query(`SELECT * FROM auth_login WHERE student_id = ?`, [
    student_id,
  ]);

  if (!existing || existing.length === 0) {
    throw { status: HTTP_STATUS.NOT_FOUND, message: '用户不存在' };
  }

  await query(`DELETE FROM auth_info WHERE student_id = ?`, [student_id]);
  await query(`DELETE FROM auth_login WHERE student_id = ?`, [student_id]);

  return { message: `用户 ${student_id} 删除成功` };
};

/** 批量删除用户（传入学号数组） */
export const batchDeleteUsers = async (studentIds: string[]) => {  
  if (!Array.isArray(studentIds) || studentIds.length === 0) {
    throw { status: HTTP_STATUS.BAD_REQUEST, message: '请求体必须为非空学号数组' };
  }

  let successCount = 0;
  const results: { student_id: string; status: string; reason?: string }[] = [];

  for (const student_id of studentIds) {
    try {
      const [existing]: any = await query(
        `SELECT * FROM auth_login WHERE student_id = ?`,
        [student_id]
      );

      if (!existing || existing.length === 0) {
        results.push({ student_id, status: 'failed', reason: '用户不存在' });
        continue;
      }

      await query(`DELETE FROM auth_info WHERE student_id = ?`, [student_id]);
      await query(`DELETE FROM auth_login WHERE student_id = ?`, [student_id]);

      results.push({ student_id, status: 'success' });
      successCount++;
    } catch (err: any) {
      results.push({ student_id, status: 'failed', reason: err.message });
    }
  }

  return {
    message: '批量删除完成',
    total: studentIds.length,
    success: successCount,
    failed: results.length - successCount,
    details: results,
  };
};

/** 修改密码（需验证旧密码+重置密码验证码） */
export const changePassword = async (body: ResetPasswordRequestBody) => {
  const { email, oldPassword, newPassword, code } = body;

  const [user] = await query<AuthLoginRecord[]>(
    `SELECT * FROM auth_login WHERE email = ?`,
    [email]
  );

  if (!user) {
    throw { status: HTTP_STATUS.NOT_FOUND, message: '用户不存在' };
  }

  const isMatch = await comparePassword(oldPassword, user.password_hash);
  if (!isMatch) {
    throw { status: HTTP_STATUS.UNAUTHORIZED, message: '旧密码错误' };
  }

  const [verifyRecord] = await query<any[]>(
    `SELECT * FROM email_verification_codes 
     WHERE email = ? AND code = ? AND type = 'reset_password'
     ORDER BY id DESC LIMIT 1`,
    [email, code]
  );

  if (!verifyRecord) {
    throw { status: HTTP_STATUS.BAD_REQUEST, message: '验证码错误或未发送' };
  }

  if (new Date(verifyRecord.expires_at) < new Date()) {
    throw { status: HTTP_STATUS.BAD_REQUEST, message: '验证码已过期' };
  }

  if (verifyRecord.verified === 1) {
    throw { status: HTTP_STATUS.BAD_REQUEST, message: '验证码已被使用，请重新获取' };
  }

  await query(`UPDATE email_verification_codes SET verified = 1 WHERE id = ?`, [
    verifyRecord.id,
  ]);

  const newPasswordHash = await hashPassword(newPassword);
  await query(`UPDATE auth_login SET password_hash = ? WHERE email = ?`, [
    newPasswordHash,
    email,
  ]);

  sendPasswordChangedEmail(email, user.student_id);

  return { message: '密码修改成功' };
};