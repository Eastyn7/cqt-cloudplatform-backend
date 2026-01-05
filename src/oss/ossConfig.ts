// 集中管理配置
import dotenv from 'dotenv';
dotenv.config();

export const OSSConfig = {
  region: process.env.OSS_REGION || 'oss-cn-chengdu',
  accessKeyId: process.env.OSS_ACCESS_KEY_ID!,
  accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET!,
  bucket: process.env.OSS_BUCKET!,
  baseUrl: process.env.OSS_BASE_URL || `https://${process.env.OSS_BUCKET}.oss-${process.env.OSS_REGION}.aliyuncs.com/`,
  uploadDir: process.env.OSS_UPLOAD_DIR || 'uploads/',
  roleArn: process.env.OSS_ROLE_ARN!,
};