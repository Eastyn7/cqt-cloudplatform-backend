import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { query } from '../db';
import { HTTP_STATUS } from '../utils/response';
import { getEnabledTemplateOrThrow } from './certificateTemplatesService';
import { ossClient } from '../oss/ossClient';
import { generateSignedUrl } from '../oss/signedUrlService';
import { PaginationQuery } from '../types/requestTypes';

const DEFAULT_THRESHOLD_HOURS = Number(process.env.CERTIFICATE_THRESHOLD_HOURS || 120);
const DEFAULT_ISSUER = '重庆工商大学';
const SERVICE_HOURS_TEMPLATE_USAGE = 'service_hours';

type RenderField = {
  key: string;
  label?: string;
  x: number;
  y: number;
  fontSize: number;
  align: 'left' | 'center' | 'right';
  fontFamily?: string;
  color?: string;
  fontWeight?: 'normal' | 'bold';
  text?: string;
};

type ContainLayout = {
  scale: number;
  offsetX: number;
  offsetY: number;
  drawWidth: number;
  drawHeight: number;
};

function buildCertNo(date = new Date()) {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const d = `${date.getDate()}`.padStart(2, '0');
  const rand = `${Math.floor(Math.random() * 10000)}`.padStart(4, '0');
  return `CTBU-${y}${m}${d}-${rand}`;
}

function parseHexColor(color?: string) {
  const hex = (color || '#1f2d3d').replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) {
    return rgb(0.12, 0.18, 0.24);
  }
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;
  return rgb(r, g, b);
}

function xmlEscape(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function getContainLayout(
  imageWidth: number,
  imageHeight: number,
  canvasWidth: number,
  canvasHeight: number
): ContainLayout {
  const scale = Math.min(canvasWidth / imageWidth, canvasHeight / imageHeight, 1);
  const drawWidth = imageWidth * scale;
  const drawHeight = imageHeight * scale;
  const offsetX = (canvasWidth - drawWidth) / 2;
  const offsetY = (canvasHeight - drawHeight) / 2;
  return { scale, offsetX, offsetY, drawWidth, drawHeight };
}

async function getStudentBaseInfo(studentId: string) {
  const [row]: any[] = await query(
    `SELECT student_id, name, total_hours FROM auth_info WHERE student_id = ?`,
    [studentId]
  );
  if (!row) {
    throw { status: HTTP_STATUS.NOT_FOUND, message: '用户不存在' };
  }
  return row;
}

async function renderCertificatePdf(
  templateKey: string,
  canvasWidth: number,
  canvasHeight: number,
  fields: RenderField[],
  payload: Record<string, string>
): Promise<Uint8Array> {
  const templateObject = await ossClient.get(templateKey);
  const bytes: Buffer = templateObject.content as Buffer;

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([canvasWidth, canvasHeight]);

  const keyLower = templateKey.toLowerCase();
  let image;
  if (keyLower.endsWith('.png')) {
    image = await pdfDoc.embedPng(bytes);
  } else if (keyLower.endsWith('.jpg') || keyLower.endsWith('.jpeg')) {
    image = await pdfDoc.embedJpg(bytes);
  } else {
    throw { status: HTTP_STATUS.BAD_REQUEST, message: '模板文件仅支持 PNG/JPG' };
  }

  const imageWidth = Number((image as any).width || canvasWidth);
  const imageHeight = Number((image as any).height || canvasHeight);
  const scaleX = canvasWidth / imageWidth;
  const scaleY = canvasHeight / imageHeight;
  const fontScale = Math.min(scaleX, scaleY);

  page.drawImage(image, {
    x: 0,
    y: 0,
    width: canvasWidth,
    height: canvasHeight,
  });

  pdfDoc.registerFontkit(fontkit);

  const customFont = await loadCustomChineseFont(pdfDoc);
  const normalFont = customFont || await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = customFont || await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  for (const field of fields) {
    const text = String(payload[field.key] ?? field.text ?? '').trim();
    if (!text) continue;

    const fontSize = (Number(field.fontSize) || 24) * fontScale;
    const font = field.fontWeight === 'bold' ? boldFont : normalFont;

    let x = (Number(field.x) || 0) * scaleX;
    const yTop = (Number(field.y) || 0) * scaleY;
    const y = canvasHeight - yTop - fontSize;

    const textWidth = font.widthOfTextAtSize(text, fontSize);
    if (field.align === 'center') x = x - textWidth / 2;
    if (field.align === 'right') x = x - textWidth;

    page.drawText(text, {
      x,
      y,
      size: fontSize,
      font,
      color: parseHexColor(field.color),
    });
  }

  return pdfDoc.save();
}

async function renderCertificatePreviewImage(
  templateKey: string,
  _canvasWidth: number,
  _canvasHeight: number,
  fields: RenderField[],
  payload: Record<string, string>
): Promise<Buffer> {
  const templateObject = await ossClient.get(templateKey);
  const bytes: Buffer = templateObject.content as Buffer;

  const metadata = await sharp(bytes).metadata();
  const imageWidth = Number(metadata.width || 0);
  const imageHeight = Number(metadata.height || 0);
  if (!imageWidth || !imageHeight) {
    throw { status: HTTP_STATUS.BAD_REQUEST, message: '模板图片尺寸读取失败' };
  }

  const textNodes = fields
    .map((field) => {
      const text = String(payload[field.key] ?? field.text ?? '').trim();
      if (!text) return '';

      const anchor = field.align === 'center' ? 'middle' : (field.align === 'right' ? 'end' : 'start');
      const x = Number(field.x) || 0;
      const y = Number(field.y) || 0;
      const fontSize = Math.max(8, Number(field.fontSize) || 24);
      const fill = (field.color && /^#[0-9a-fA-F]{6}$/.test(field.color)) ? field.color : '#1f2d3d';
      const fontWeight = field.fontWeight === 'bold' ? '700' : '400';
      const fontFamily = xmlEscape(field.fontFamily || 'Noto Sans CJK SC, Microsoft YaHei, SimSun, sans-serif');

      return `<text x="${x.toFixed(2)}" y="${y.toFixed(2)}" text-anchor="${anchor}" dominant-baseline="hanging" font-size="${fontSize.toFixed(2)}" font-weight="${fontWeight}" fill="${fill}" font-family="${fontFamily}">${xmlEscape(text)}</text>`;
    })
    .filter(Boolean)
    .join('');

  const svgOverlay = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${imageWidth}" height="${imageHeight}">${textNodes}</svg>`
  );

  return sharp(bytes)
    .composite([{ input: svgOverlay, left: 0, top: 0 }])
    .png()
    .toBuffer();
}

async function loadCustomChineseFont(pdfDoc: PDFDocument) {
  const fontPath = process.env.CERTIFICATE_FONT_PATH;
  const fontKey = process.env.CERTIFICATE_FONT_KEY;

  const candidatePaths: string[] = [];

  if (fontPath && typeof fontPath === 'string') {
    if (path.isAbsolute(fontPath)) {
      candidatePaths.push(fontPath);
    } else {
      candidatePaths.push(path.resolve(process.cwd(), fontPath));
    }
  }

  candidatePaths.push(
    path.resolve(process.cwd(), 'src/assets/fonts/NotoSansCJK-Regular-1.otf'),
    path.resolve(process.cwd(), 'assets/fonts/NotoSansCJK-Regular-1.otf')
  );

  const fontsDirInSrc = path.resolve(process.cwd(), 'src/assets/fonts');
  if (fs.existsSync(fontsDirInSrc)) {
    const files = fs.readdirSync(fontsDirInSrc);
    const regular = files.find(name => /regular/i.test(name) && /\.(otf|ttf)$/i.test(name));
    if (regular) {
      candidatePaths.push(path.join(fontsDirInSrc, regular));
    }
  }

  for (const localPath of candidatePaths) {
    if (localPath && fs.existsSync(localPath)) {
      const bytes = fs.readFileSync(localPath);
      return pdfDoc.embedFont(bytes, { subset: true });
    }
  }

  if (fontKey) {
    const fontObject = await ossClient.get(fontKey);
    const bytes: Buffer = fontObject.content as Buffer;
    return pdfDoc.embedFont(bytes, { subset: true });
  }

  throw {
    status: HTTP_STATUS.INTERNAL_ERROR,
    message: '未找到可用中文字体：请在 src/assets/fonts 放置 Regular 字体，或设置 CERTIFICATE_FONT_PATH / CERTIFICATE_FONT_KEY'
  };
}

function buildDefaultPayload(studentName: string, totalHours: number, now = new Date()) {
  return {
    name: String(studentName || ''),
    hours: String(totalHours),
    date: `${now.getFullYear()}年${String(now.getMonth() + 1).padStart(2, '0')}月${String(now.getDate()).padStart(2, '0')}日`,
    issuer: DEFAULT_ISSUER,
  };
}

export const getServiceHoursEligibility = async (studentId: string, templateId?: number) => {
  const student = await getStudentBaseInfo(studentId);
  const totalHours = Number(student.total_hours || 0);
  const threshold = DEFAULT_THRESHOLD_HOURS;

  let template: any = null;
  try {
    template = await getEnabledTemplateOrThrow(templateId, SERVICE_HOURS_TEMPLATE_USAGE);
  } catch {
    template = null;
  }

  return {
    eligible: totalHours >= threshold && !!template,
    total_hours: totalHours,
    threshold_hours: threshold,
    template_id: template?.template_id ?? null,
    reason: !template
      ? '未配置可用模板'
      : totalHours < threshold
        ? '服务时长未达标'
        : ''
  };
};

export const generateServiceCertificate = async (
  studentId: string,
  templateId?: number,
  payload: Record<string, string> = {},
  createdBy?: string
) => {
  const template = await getEnabledTemplateOrThrow(templateId, SERVICE_HOURS_TEMPLATE_USAGE);
  const student = await getStudentBaseInfo(studentId);

  const fields: RenderField[] = Array.isArray(template.fields_json)
    ? template.fields_json
    : JSON.parse(template.fields_json || '[]');

  const now = new Date();
  const defaultPayload: Record<string, string> = buildDefaultPayload(
    String(student.name || ''),
    Number(student.total_hours || 0),
    now
  );

  const finalPayload = {
    ...defaultPayload,
    ...(payload || {}),
  };

  const pdfBytes = await renderCertificatePdf(
    template.template_key,
    Number(template.canvas_width),
    Number(template.canvas_height),
    fields,
    finalPayload
  );

  let certNo = buildCertNo(now);
  let duplicate = true;
  let retry = 0;
  while (duplicate && retry < 5) {
    const [exists]: any[] = await query(`SELECT cert_id FROM service_certificates WHERE cert_no = ?`, [certNo]);
    if (!exists) duplicate = false;
    else {
      certNo = buildCertNo(new Date(Date.now() + (retry + 1) * 1000));
      retry += 1;
    }
  }

  const certKey = `uploads/certificates-hours/${studentId}/${certNo}.pdf`;
  await ossClient.put(certKey, Buffer.from(pdfBytes), {
    headers: {
      'Content-Type': 'application/pdf',
      'Cache-Control': 'no-cache',
    },
  });

  const result: any = await query(
    `INSERT INTO service_certificates
      (student_id, template_id, cert_no, total_hours, threshold_hours, issued_date, payload_json, certificate_key, status, created_by)
     VALUES (?, ?, ?, ?, ?, CURDATE(), ?, ?, 'generated', ?)`,
    [
      studentId,
      Number(template.template_id),
      certNo,
      Number(student.total_hours || 0),
      Number(DEFAULT_THRESHOLD_HOURS),
      JSON.stringify(finalPayload),
      certKey,
      createdBy || studentId,
    ]
  );

  return {
    cert_id: result.insertId,
    cert_no: certNo,
    certificate_key: certKey,
    download_url: generateSignedUrl(certKey, 600),
    status: 'generated',
  };
};

export const previewServiceCertificate = async (
  studentId: string,
  templateId?: number,
  createdBy?: string
) => {
  const student = await getStudentBaseInfo(studentId);
  const template = await getEnabledTemplateOrThrow(templateId, SERVICE_HOURS_TEMPLATE_USAGE);

  const fields: RenderField[] = Array.isArray(template.fields_json)
    ? template.fields_json
    : JSON.parse(template.fields_json || '[]');

  const payload = buildDefaultPayload(
    String(student.name || ''),
    Number(student.total_hours || 0),
    new Date()
  );

  const previewImageBytes = await renderCertificatePreviewImage(
    template.template_key,
    Number(template.canvas_width),
    Number(template.canvas_height),
    fields,
    payload
  );

  const previewKey = `uploads/certificates-previews/${studentId}/${Date.now()}_${createdBy || studentId}.png`;
  await ossClient.put(previewKey, previewImageBytes, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'no-cache',
    },
  });

  return {
    template_id: template.template_id,
    preview_key: previewKey,
    preview_url: generateSignedUrl(previewKey, 300),
    payload,
  };
};

export const getServiceCertificatesPage = async (queryParams: PaginationQuery = {}, currentUser?: any) => {
  const { page = 1, pageSize = 10, student_id } = queryParams as any;
  const pageNum = Number(page) || 1;
  const sizeNum = Number(pageSize) || 10;

  const conditions: string[] = [];
  const values: any[] = [];

  if (currentUser?.role === 'user') {
    conditions.push('sc.student_id = ?');
    values.push(String(currentUser.student_id));
  } else if (student_id) {
    conditions.push('sc.student_id = ?');
    values.push(String(student_id));
  }

  const whereSQL = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const [{ total }] = await query<any[]>(
    `SELECT COUNT(*) as total FROM service_certificates sc ${whereSQL}`,
    values
  );

  const rows = await query<any[]>(
    `SELECT sc.*, ct.template_name
     FROM service_certificates sc
     LEFT JOIN certificate_templates ct ON sc.template_id = ct.template_id
     ${whereSQL}
     ORDER BY sc.created_at DESC
     LIMIT ? OFFSET ?`,
    [...values, sizeNum, (pageNum - 1) * sizeNum]
  );

  const list = rows.map((row: any) => ({
    ...row,
    payload_json: typeof row.payload_json === 'string' ? JSON.parse(row.payload_json) : row.payload_json,
  }));

  return {
    list,
    pagination: {
      page: pageNum,
      pageSize: sizeNum,
      total,
    }
  };
};

export const getServiceCertificateDownload = async (certId: number, currentUser: any) => {
  const [row]: any[] = await query(
    `SELECT * FROM service_certificates WHERE cert_id = ?`,
    [certId]
  );

  if (!row) {
    throw { status: HTTP_STATUS.NOT_FOUND, message: '证书不存在' };
  }

  if (currentUser?.role === 'user' && String(currentUser.student_id) !== String(row.student_id)) {
    throw { status: HTTP_STATUS.FORBIDDEN, message: '无权下载该证书' };
  }

  if (String(row.status) !== 'generated') {
    throw { status: HTTP_STATUS.BAD_REQUEST, message: '证书已作废，无法下载' };
  }

  return {
    cert_id: row.cert_id,
    cert_no: row.cert_no,
    certificate_key: row.certificate_key,
    download_url: generateSignedUrl(row.certificate_key, 600),
  };
};

export const revokeServiceCertificate = async (certId: number, currentUser: any, reason?: string) => {
  const [row]: any[] = await query(
    `SELECT * FROM service_certificates WHERE cert_id = ?`,
    [certId]
  );

  if (!row) {
    throw { status: HTTP_STATUS.NOT_FOUND, message: '证书不存在' };
  }

  if (currentUser?.role === 'user') {
    throw { status: HTTP_STATUS.FORBIDDEN, message: '无权作废证书' };
  }

  if (String(row.status) === 'revoked') {
    return {
      cert_id: row.cert_id,
      cert_no: row.cert_no,
      status: 'revoked',
      message: '证书已是作废状态',
      revoked_reason: reason || '',
    };
  }

  await query(
    `UPDATE service_certificates
     SET status = 'revoked', updated_at = CURRENT_TIMESTAMP
     WHERE cert_id = ?`,
    [certId]
  );

  return {
    cert_id: row.cert_id,
    cert_no: row.cert_no,
    status: 'revoked',
    revoked_reason: reason || '',
    revoked_by: currentUser?.student_id ? String(currentUser.student_id) : '',
  };
};
