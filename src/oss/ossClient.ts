// 客户端初始化
import OSS from 'ali-oss';
import { OSSConfig } from './ossConfig';

export const ossClient = new OSS({
  region: OSSConfig.region,
  accessKeyId: OSSConfig.accessKeyId,
  accessKeySecret: OSSConfig.accessKeySecret,
  bucket: OSSConfig.bucket,
});