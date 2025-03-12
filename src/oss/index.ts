import OSS from 'ali-oss';
import dotenv from 'dotenv';

// 加载 .env 文件中的环境变量
dotenv.config();

// 初始化 OSS 客户端
const client = new OSS({
  region: process.env.OSS_REGION as string, // 区域
  accessKeyId: process.env.OSS_ACCESS_KEY_ID as string, // AccessKeyId
  accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET as string, // AccessKeySecret
  bucket: process.env.OSS_BUCKET as string, // 存储空间名称
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
