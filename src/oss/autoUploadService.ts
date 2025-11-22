import mime from 'mime-types';
import path from 'path';
import { uploadFileToOSS } from './uploadService';

/** 根据MIME类型获取文件分类（images/videos/documents/others） */
const getCategoryByMime = (mimeType: string): string => {
  if (mimeType.startsWith('image/')) return 'images';
  if (mimeType.startsWith('video/')) return 'videos';
  if (mimeType === 'application/pdf') return 'documents';
  if (mimeType.includes('word') || mimeType.includes('excel') || mimeType.includes('ppt'))
    return 'documents';
  return 'others';
};

/** 上传Base64文件，自动识别类型并分类存储 */
export const uploadBase64Auto = async (base64Data: string): Promise<string> => {
  const match = /^data:(.*?);base64,/.exec(base64Data);
  if (!match) throw new Error('无效的 Base64 数据格式');

  const mimeType = match[1];
  const buffer = Buffer.from(base64Data.replace(/^data:.*;base64,/, ''), 'base64');
  const ext = mime.extension(mimeType) || 'bin';
  const fileName = `${Date.now()}.${ext}`;
  const category = getCategoryByMime(mimeType);

  return uploadFileToOSS(buffer, fileName, category);
};

/** 上传Multer文件（Express中间件接收），自动分类存储 */
export const uploadMulterFileAuto = async (file: Express.Multer.File): Promise<string> => {
  const { buffer, originalname, mimetype } = file;
  const category = getCategoryByMime(mimetype);
  const ext = path.extname(originalname) || '.bin';
  const fileName = `${Date.now()}${ext}`;

  return uploadFileToOSS(buffer, fileName, category);
};