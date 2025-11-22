import { ossClient } from './ossClient';
import fs from 'fs';
import path from 'path';

export const downloadFileFromOSS = async (objectKey: string): Promise<string> => {
  const tempPath = path.join('/CQTtmp', `${Date.now()}_${path.basename(objectKey)}`);

  const result = await ossClient.get(objectKey);
  fs.writeFileSync(tempPath, result.content);

  return tempPath;
};