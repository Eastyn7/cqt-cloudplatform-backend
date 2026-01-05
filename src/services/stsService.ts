import PopCore = require('@alicloud/pop-core');
import { OSSConfig } from '../oss/ossConfig';

/**
 * 获取 OSS 上传用的 STS 临时凭证
 */
export const getSTSForOSS = async () => {
  // 强制断言为 any，干掉所有 TS 报错
  const client: any = new (PopCore as any).RPCClient({
    accessKeyId: OSSConfig.accessKeyId,
    accessKeySecret: OSSConfig.accessKeySecret,
    endpoint: 'https://sts.aliyuncs.com',
    apiVersion: '2015-04-01',
  });

  const params = {
    RegionId: 'cn-chengdu',
    RoleArn: OSSConfig.roleArn,
    RoleSessionName: `web-upload-${Date.now()}`,
    DurationSeconds: 3600,
    Policy: JSON.stringify({
      Version: '1',
      Statement: [
        {
          Effect: 'Allow',
          Action: ['oss:PutObject', 'oss:GetObject'],
          Resource: [`acs:oss:*:*:${OSSConfig.bucket}/uploads/*`],
        },
      ],
    }),
  };

  try {
    const result = await client.request('AssumeRole', params, { method: 'POST' });

    return {
      AccessKeyId: result.Credentials.AccessKeyId,
      AccessKeySecret: result.Credentials.AccessKeySecret,
      SecurityToken: result.Credentials.SecurityToken,
      Expiration: result.Credentials.Expiration,
      region: `oss-${OSSConfig.region}`,
      bucket: OSSConfig.bucket,
    };
  } catch (error: any) {
    console.error('STS 获取失败:', error);
    throw new Error(`获取 STS 凭证失败: ${error.message || error}`);
  }
};