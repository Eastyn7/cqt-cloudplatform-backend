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

export interface UpdateAuthInfo {
  nickname?: string;
  phone?: string;
  gender?: Gender;
  avatar?: string;
  bio?: string;
}

export interface BackboneMember {
  auth_id: number;            // 关联认证表的外键，也是主键
  role_id: number;            // 身份编号
  student_id?: number;         // 工号
  department_id: number;      // 所属部门id
  role_name?: string;         // 职位名称（可选）
  photo?: string;             // 展示照 URL（可选）
  description?: string;       // 简介（可选）
  created_at?: string;        // 创建时间，通常以字符串形式返回
  updated_at?: string;        // 更新时间，通常以字符串形式返回
}

export interface Department {
  id: number
  name: string
  description: string
}

