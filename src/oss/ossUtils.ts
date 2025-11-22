import path from 'path';
import { OSSConfig } from './ossConfig';

/**
 * 生成 OSS 文件路径
 * @param category 文件类型目录，如 'avatars' | 'files' | 'temp'
 * @param fileName 文件名
 */
export const generateOSSPath = (category: string, fileName: string) => {
  const timeStamp = Date.now();
  return path.posix.join(OSSConfig.uploadDir, category, `${timeStamp}_${fileName}`);
};

/**
 * 拼接完整 URL
 */
export const getOSSUrl = (objectKey: string) => `${OSSConfig.baseUrl}${objectKey}`;