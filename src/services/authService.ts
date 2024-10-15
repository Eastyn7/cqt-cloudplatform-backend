import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from '../db';
import { RegisterUser, User } from '../types';
import { hashPassword, comparePassword } from '../utils/hashPassword';

// 注册用户
export const registerUser = async (student_id: string, email: string, password: string): Promise<RegisterUser> => {
  // 查询学号或邮箱是否已存在
  const existingUser = await query<User[]>('SELECT * FROM user_login WHERE student_id = ? OR email = ?', [student_id, email]);
  if (existingUser.length > 0) {
    throw new Error('学号或邮箱已存在');
  }

  // 哈希密码
  const passwordHash = await hashPassword(password);

  // 插入新用户到数据库
  const result = await query<{ insertId: number }>(
    'INSERT INTO user_login (student_id, email, password_hash) VALUES (?, ?, ?)',
    [student_id, email, passwordHash]
  );

  // 返回新注册的用户信息（不包含 password_hash）
  const newUser: RegisterUser = { auth_id: result.insertId, student_id, email };
  return newUser;
};

// 登录用户
export const loginUser = async (loginInput: string, password: string): Promise<string> => {
  let user;

  // 判断输入是学号还是邮箱
  if (loginInput.includes('@')) {
    // 邮箱登录
    user = await query<User[]>('SELECT * FROM user_login WHERE email = ?', [loginInput]);
  } else {
    // 学号登录
    user = await query<User[]>('SELECT * FROM user_login WHERE student_id = ?', [loginInput]);
  }

  if (user.length === 0) {
    throw new Error('用户不存在');
  }

  // 验证密码是否匹配
  const validPassword = await comparePassword(password, user[0].password_hash);
  if (!validPassword) {
    throw new Error('密码错误');
  }

  // 生成JWT token
  const token = jwt.sign(
    { auth_id: user[0].auth_id, student_id: user[0].student_id },
    'your_jwt_secret',
    { expiresIn: '1h' }
  );
  return token;
};
