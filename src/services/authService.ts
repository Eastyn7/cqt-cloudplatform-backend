import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from '../db';
import { Auth, AuthRegister, AuthLogin, AuthInfo } from '../types';
import { hashPassword, comparePassword } from '../utils/hashPassword';

// 注册用户
export const registerAuth = async (student_id: string, email: string, password: string): Promise<AuthRegister> => {
  // 查询学号或邮箱是否已存在
  const existingAuth = await query<Auth[]>('SELECT * FROM Auth_login WHERE student_id = ? OR email = ?', [student_id, email]);
  if (existingAuth.length > 0) {
    throw new Error('学号或邮箱已存在');
  }

  // 哈希密码
  const passwordHash = await hashPassword(password);

  // 插入新用户到数据库
  const result = await query<{ insertId: number }>(
    'INSERT INTO Auth_login (student_id, email, password_hash) VALUES (?, ?, ?)',
    [student_id, email, passwordHash]
  );

  // 返回新注册的用户信息（不包含 password_hash）
  const newAuth: AuthRegister = { auth_id: result.insertId, student_id, email };
  return newAuth;
};

// 登录用户
export const loginAuth = async (loginInput: string, password: string): Promise<{ auth_id: number, student_id: string, email: string, token: string }> => {
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
  const token = 'Bearer '+jwt.sign(
    { auth_id: AuthLogin[0].auth_id, student_id: AuthLogin[0].student_id },
    'CTBU CTQ',
    { expiresIn: '1h' }
  );

  // 返回用户信息和 token
  return {
    auth_id: AuthLogin[0].auth_id,
    student_id: AuthLogin[0].student_id,
    email: AuthLogin[0].email,
    token,
  };
};


// 获取用户的信息
export const getAuthInfo = async (auth_id: number): Promise<AuthInfo> => {
  // 查询用户详细信息
  const authInfo = await query<AuthInfo[]>(
    `SELECT 
      role, nickname, userName, gender, avatar, phone, bio
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