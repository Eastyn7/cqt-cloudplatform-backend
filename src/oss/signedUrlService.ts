import { ossClient } from './ossClient';

/**
 * 生成带签名的临时访问 URL
 * @param objectKey 文件路径
 * @param expires 有效期（秒），默认 600 秒
 */
export const generateSignedUrl = (objectKey: string, expires = 600): string => {
  try {
    return ossClient.signatureUrl(objectKey, { expires });
  } catch (err) {
    console.error('❌ 生成签名 URL 失败:', err);
    throw new Error('生成签名 URL 失败');
  }
};