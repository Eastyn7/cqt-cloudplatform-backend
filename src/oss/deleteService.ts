import { ossClient } from './ossClient';

/** 删除单个OSS文件（路径不含域名） */
export const deleteFileFromOSS = async (objectKey: string): Promise<void> => {
  try {
    await ossClient.delete(objectKey);
    console.log(`✅ 删除成功: ${objectKey}`);
  } catch (err) {
    console.error('❌ 删除失败:', err);
    throw new Error('删除失败');
  }
};

/** 批量删除OSS文件（路径不含域名） */
export const deleteFilesFromOSS = async (objectKeys: string[]): Promise<void> => {
  if (objectKeys.length === 0) return;
  try {
    await ossClient.deleteMulti(objectKeys, { quiet: true });
    console.log(`✅ 批量删除成功: ${objectKeys.length} 个文件`);
  } catch (err) {
    console.error('❌ 批量删除失败:', err);
    throw new Error('批量删除失败');
  }
};