import mammoth from 'mammoth';
import fs from 'fs';
import { uploadFileToOSS } from '../oss/uploadService';
import { deleteFilesFromOSS } from '../oss/deleteService';

export const convertDocxToHtml = async (filePath: string): Promise<{
  html: string;
  imageKeys: string[];
  // 关键：新增返回
}> => {
  const buffer = fs.readFileSync(filePath);
  const uploadedObjectKeys: string[] = [];

  try {
    const result = await mammoth.convertToHtml(
      { buffer },
      {
        convertImage: mammoth.images.imgElement(async (image) => {
          try {
            const imageBuffer = await image.read();
            const ext = image.contentType.includes('png') ? '.png' : '.jpg';
            const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}${ext}`;

            const { url, objectKey } = await uploadFileToOSS(imageBuffer, fileName, 'announcement/images');

            uploadedObjectKeys.push(objectKey);

            return {
              src: url,
              style: 'max-width: 100%; height: auto;',
            };
          } catch (uploadErr) {
            if (uploadedObjectKeys.length > 0) {
              await deleteFilesFromOSS(uploadedObjectKeys).catch(() => { });
            }
            throw new Error(`图片上传失败: ${uploadErr instanceof Error ? uploadErr.message : '未知错误'}`);
          }
        }),
      }
    );

    return {
      html: result.value,
      imageKeys: uploadedObjectKeys, // 成功后返回
    };
  } catch (error) {
    if (uploadedObjectKeys.length > 0) {
      console.warn(`Word 转换失败，清理 ${uploadedObjectKeys.length} 张图片...`);
      await deleteFilesFromOSS(uploadedObjectKeys).catch((e) => {
        console.error('清理失败:', e);
      });
    }
    throw error;
  }
};