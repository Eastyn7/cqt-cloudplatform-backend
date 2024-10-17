type Gender = 0 | 1 | 2 // 0: 保密, 1: 男, 2: 女

// 定义数据传输对象类型
export interface Auth {
  auth_id: number;                // 用户账户唯一自增id
  student_id: string;             // 学号
  email: string;                  // 邮箱
}

export interface AuthLogin extends Auth {
  password_hash: string;          // 加密后的密码值
}

export interface AuthRegister extends Auth {
}

export interface AuthInfo extends Auth {
  role: number                    // 身份
  nickname: string                // 用户名
  userName: string                // 真实姓名
  gender: Gender                  // 性别：0保密，1男，2女
  avatar: string                  // 用户头像
  phone: string                   // 电话
  bio: string                     // 个人简介
}