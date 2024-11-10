import OSS from 'ali-oss';

// 初始化OSS客户端
const client = new OSS({
  region: 'oss-cn-chengdu', // 区域，例如 'oss-cn-hangzhou'
  accessKeyId: 'LTAI5tPMxqNbJ91VyJqcgGoV', // AccessKeyId
  accessKeySecret: 'IeGTiMcbZYK2WtSfj05uR2bUucUqVX', // AccessKeySecret
  bucket: 'ctbu-cqt', // 存储空间名称
});

// 上传图片到 OSS
export const uploadImageToOSS = async (base64Image: string): Promise<string> => {
  // 使用时间戳生成文件名，确保唯一性
  const fileName = `avatars/${Date.now()}.png`;

  // 将 base64 转为 Buffer
  const buffer = Buffer.from(base64Image.replace(/^data:image\/\w+;base64,/, ""), 'base64');

  try {
    // 上传图片到 OSS
    const result = await client.put(fileName, buffer);

    // 生成带签名的 URL（有效期 1 小时）
    const signedUrl = client.signatureUrl(result.name, { expires: 3600 });

    // 返回带签名的 URL
    return signedUrl;
  } catch (error) {
    console.error('上传失败:', error);
    throw new Error('上传到 OSS 失败');
  }
};

// /**
//  * 上传图片至OSS并返回访问URL
//  * @param fileName - 文件在OSS中的名称
//  * @param filePath - 本地文件路径
//  * @returns 上传成功后的文件访问URL
//  */
// export async function uploadFileToOSS(fileName: string, filePath: string): Promise<string> {
//   try {
//     // 将文件上传到 OSS
//     const result = await client.put(fileName, filePath);
//     console.log('上传成功:', result);

//     // 返回文件的访问 URL
//     return result.url;
//   } catch (error) {
//     console.error('上传失败:', error);
//     throw error;
//   }
// }
