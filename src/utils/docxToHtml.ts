import mammoth from 'mammoth';
import fs from 'fs';

export const convertDocxToHtml = async (filePath: string) => {
  const buffer = fs.readFileSync(filePath);
  const result = await mammoth.convertToHtml({ buffer });
  return result.value;
};