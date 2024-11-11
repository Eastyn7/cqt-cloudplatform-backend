import OSS from 'ali-oss';

// 初始化 OSS 客户端
const client = new OSS({
  region: 'oss-cn-chengdu', // 区域，例如 'oss-cn-hangzhou'
  accessKeyId: 'LTAI5tPMxqNbJ91VyJqcgGoV', // AccessKeyId
  accessKeySecret: 'IeGTiMcbZYK2WtSfj05uR2bUucUqVX', // AccessKeySecret
  bucket: 'ctbu-cqt', // 存储空间名称
});

// 上传图片到 OSS
export const uploadImageToOSS = async (base64Image: string): Promise<string> => {
  const fileName = `avatars/${Date.now()}.png`;
  const buffer = Buffer.from(base64Image.replace(/^data:image\/\w+;base64,/, ""), 'base64');

  const bucket = 'ctbu-cqt';  // 用您的实际 bucket 名称替换
  const region = 'oss-cn-chengdu';  // 用您的实际 region 替换

  try {
    // 上传图片到 OSS，设置缓存控制
    const result = await client.put(fileName, buffer, {
      headers: {
        'Cache-Control': 'max-age=31536000', // 设置缓存过期时间为一年
        'x-oss-acl': 'public-read', // 设置文件权限为 public-read
      },
    });

    // 构造文件的访问 URL
    const fileUrl = `https://${bucket}.${region}.aliyuncs.com/${result.name}`;

    return fileUrl;
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
