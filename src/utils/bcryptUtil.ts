import bcrypt from 'bcrypt';

/**
 * 生成密码哈希（bcrypt加密，带自动加盐）
 * @param password 明文密码
 * @param saltRounds 加盐强度（默认10，值越高加密越慢但越安全）
 * @returns 加密后的哈希字符串
 */
export const hashPassword = async (password: string, saltRounds = 10): Promise<string> => {
  const salt = await bcrypt.genSalt(saltRounds);
  return bcrypt.hash(password, salt);
};

/**
 * 比对密码（登录验证用，明文密码与哈希密码匹配校验）
 * @param password 用户输入的明文密码
 * @param hashedPassword 数据库存储的加密密码
 * @returns 是否匹配的布尔值
 */
export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

/**
 * 同步生成密码哈希（适用于测试环境，避免异步等待）
 * @param password 明文密码
 * @param saltRounds 加盐强度（默认10）
 * @returns 加密后的哈希字符串
 */
export const hashPasswordSync = (password: string, saltRounds = 10): string => {
  const salt = bcrypt.genSaltSync(saltRounds);
  return bcrypt.hashSync(password, salt);
};

/**
 * 同步比对密码（适用于测试环境）
 * @param password 明文密码
 * @param hashedPassword 加密密码
 * @returns 是否匹配的布尔值
 */
export const comparePasswordSync = (password: string, hashedPassword: string): boolean => {
  return bcrypt.compareSync(password, hashedPassword);
};