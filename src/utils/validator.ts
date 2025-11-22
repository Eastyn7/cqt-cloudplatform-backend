/**
 * 常用校验工具（只返回 boolean，不负责响应）
 */

/** 学号：10位数字 */
export const isStudentId = (id: string): boolean => {
  return /^\d{10}$/.test(String(id));
};

/** 校内邮箱：以 @ctbu.edu.cn 结尾 */
export const isCtbuEmail = (email: string): boolean => {
  return /^[a-zA-Z0-9._%+-]+@ctbu\.edu\.cn$/.test(String(email));
};

/** 密码强度：至少6位，包含大写、小写、数字（根据你原来规则） */
export const isStrongPassword = (password: string): boolean => {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/.test(String(password));
};

/** 性别（允许值：男 / 女 / 其他） */
export const isGender = (gender: string): boolean => {
  return ['男', '女', '其他'].includes(String(gender));
};

/** 通用邮箱（备用） */
export const isEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email));
};

/** 手机号（中国手机号校验，备用） */
export const isPhone = (phone: string): boolean => {
  return /^1[3-9]\d{9}$/.test(String(phone));
};