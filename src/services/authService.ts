import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from '../db';
import { Auth, AuthRegister, AuthLogin, AuthInfo, UpdateAuthInfo } from '../types';
import { hashPassword, comparePassword } from '../utils/hashPassword';
import { uploadImageToOSS } from '../oss'

// 注册用户
export const registerAuth = async (username: string, student_id: string, email: string, password: string): Promise<AuthRegister> => {
  // 查询学号或邮箱是否已存在
  const existingAuth = await query<Auth[]>('SELECT * FROM Auth_login WHERE student_id = ? OR email = ?', [student_id, email]);
  if (existingAuth.length > 0) {
    throw new Error('学号或邮箱已存在');
  }

  // 哈希密码
  const passwordHash = await hashPassword(password);

  // 插入新用户到数据库
  const result = await query<{ insertId: number }>(
    'INSERT INTO auth_login (student_id, email, password_hash) VALUES (?, ?, ?)',
    [student_id, email, passwordHash]
  );

  // 获取新插入用户的 auth_id
  const authId = result.insertId;

  // 更新 username 到 auth_info 表
  await query('UPDATE auth_info SET username = ? WHERE auth_id = ?', [username, authId]);

  // 返回新注册的用户信息（不包含 password_hash）
  const newAuth: AuthRegister = { auth_id: authId, student_id, email };
  return newAuth;
};


// 登录用户
export const loginAuth = async (loginInput: string, password: string): Promise<{ auth_id: number, student_id: string, email: string, token: string, expiresIn: number }> => {
  let AuthLogin;

  // 判断输入是学号还是邮箱
  if (loginInput.includes('@')) {
    // 邮箱登录
    AuthLogin = await query<AuthLogin[]>('SELECT * FROM Auth_login WHERE email = ?', [loginInput]);
  } else {
    // 学号登录
    AuthLogin = await query<AuthLogin[]>('SELECT * FROM Auth_login WHERE student_id = ?', [loginInput]);
  }

  if (AuthLogin.length === 0) {
    throw new Error('用户不存在');
  }

  // 验证密码是否匹配
  const validPassword = await comparePassword(password, AuthLogin[0].password_hash);
  if (!validPassword) {
    throw new Error('密码错误');
  }

  // 生成JWT token
  const expiresIn = 3600; // 过期时间为3600秒（1小时）
  const token = 'Bearer ' + jwt.sign(
    { auth_id: AuthLogin[0].auth_id, student_id: AuthLogin[0].student_id },
    'CTBU CTQ',
    { expiresIn: expiresIn } // 使用数字作为过期时间
  );

  // 返回用户信息和 token
  return {
    auth_id: AuthLogin[0].auth_id,
    student_id: AuthLogin[0].student_id,
    email: AuthLogin[0].email,
    token,
    expiresIn
  };
};



// 获取用户的信息
export const getAuthInfo = async (auth_id: number): Promise<AuthInfo> => {
  // 查询用户详细信息
  const authInfo = await query<AuthInfo[]>(
    `SELECT 
      role, nickname, username, gender, avatar, phone, bio
     FROM Auth_info 
     WHERE auth_id = ?`,
    [auth_id]
  );

  if (authInfo.length === 0) {
    throw new Error('用户信息不存在');
  }

  // 返回用户的详细信息
  return authInfo[0]; // 假设只会有一个匹配的用户
};


// 更新用户信息
export const updateUserInfo = async (auth_id: number, updates: UpdateAuthInfo): Promise<string> => {
  const fields: string[] = []; // 用于存储 SQL 更新字段表达式
  const values: any[] = []; // 用于存储对应字段的值

  // 获取 UpdateAuthInfo 类型中允许的字段
  const allowedFields: Array<keyof UpdateAuthInfo> = ['nickname', 'phone', 'gender', 'avatar', 'bio'];

  // 如果有 avatar 字段，首先上传图片到阿里云
  if (updates.avatar) {
    try {
      // 将 base64 图片上传到 OSS，获取 URL
      const avatarUrl = await uploadImageToOSS(updates.avatar);
      updates.avatar = avatarUrl; // 替换为上传到 OSS 后的图片 URL
    } catch (error) {
      throw new Error('头像上传失败');
    }
  }

  // 处理允许的字段并生成 SQL 更新表达式
  for (const key in updates) {
    if (allowedFields.includes(key as keyof UpdateAuthInfo) && updates[key as keyof UpdateAuthInfo] !== "" && updates[key as keyof UpdateAuthInfo] !== null && updates[key as keyof UpdateAuthInfo] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(updates[key as keyof UpdateAuthInfo]);
    }
  }

  // 如果没有可更新的字段，抛出异常
  if (fields.length === 0) {
    throw new Error('没有可更新的字段');
  }

  // 拼接 SQL 更新语句
  const updateQuery = `UPDATE Auth_info SET ${fields.join(', ')} WHERE auth_id = ?`;
  values.push(auth_id); // 将 auth_id 添加到参数数组

  try {
    const result = await query<{ affectedRows: number }>(updateQuery, values);
    return result.affectedRows > 0 ? '更新成功' : '用户不存在或无更改';
  } catch (error) {
    throw new Error('更新用户信息失败');
  }
};
