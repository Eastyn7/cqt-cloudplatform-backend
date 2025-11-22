import { ossClient } from './ossClient';
import { generateOSSPath, getOSSUrl } from './ossUtils';

/**
 * 上传文件到 OSS
 * @param file 文件 Buffer
 * @param fileName 文件名（例如 xxx.png）
 * @param category 文件类别目录（如 avatars / files）
 */
export const uploadFileToOSS = async (
  file: Buffer,
  fileName: string,
  category = 'default'
): Promise<string> => {
  const objectKey = generateOSSPath(category, fileName);

  try {
    // 上传文件到 OSS，不再设置 ACL
    const result = await ossClient.put(objectKey, file, {
      headers: {
        'Cache-Control': 'max-age=31536000', // 设置缓存有效期为一年
      },
    });

    // 生成可访问 URL（根据 bucket + region）
    return getOSSUrl(result.name);
  } catch (err) {
    console.error('❌ 上传到 OSS 失败:', err);
    throw new Error('上传失败，请稍后再试');
  }
};