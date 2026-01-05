import crypto from 'crypto';
import { OSSConfig } from '../oss/ossConfig';

/**
 * 生成前端直传 OSS 的签名信息
 * @param dir 上传目录（如 "avatars/" "photos/"，默认 "uploads/"）
 * @param expireTime 签名过期时间（秒，默认 120 秒）
 * @returns OSS 直传所需签名配置
 */
export const generateOSSPolicy = (dir = 'uploads/', expireTime = 120) => {
  const now = Math.floor(Date.now() / 1000);
  const expireEnd = now + expireTime; // 签名过期时间戳
  const expiration = new Date(expireEnd * 1000).toISOString(); // OSS 要求的过期时间格式

  // 限制最大上传文件大小为 10MB
  const maxSize = 10 * 1024 * 1024;

  // 构建 OSS 上传策略（限制上传目录、文件大小）
  const policyText = {
    expiration,
    conditions: [
      ['content-length-range', 0, maxSize], // 文件大小范围
      ['starts-with', '$key', dir], // 上传文件路径前缀（限制目录）
      ['starts-with', '$Content-Disposition', ''], // 允许任意 Content-Disposition（包括 inline）
      ["eq", "$success_action_status", "200"], // 成功状态码必须为 200
    ]
  };

  // 策略 Base64 编码（OSS 要求格式）
  const policyBase64 = Buffer.from(JSON.stringify(policyText)).toString('base64');
  // HMAC-SHA1 签名（使用 OSS 访问密钥Secret）
  const signature = crypto
    .createHmac('sha1', OSSConfig.accessKeySecret)
    .update(policyBase64)
    .digest('base64');

  // 返回前端直传所需配置
  return {
    host: OSSConfig.baseUrl, // OSS 存储桶基础地址
    accessid: OSSConfig.accessKeyId, // 访问密钥ID
    signature, // 签名信息
    policy: policyBase64, // Base64 编码的策略
    expire: expireEnd, // 签名过期时间戳
    dir // 允许上传的目录
  };
};