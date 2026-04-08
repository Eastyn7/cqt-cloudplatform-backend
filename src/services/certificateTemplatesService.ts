import { query } from '../db';
import pool from '../db';
import { HTTP_STATUS } from '../utils/response';
import { PaginationQuery } from '../types/requestTypes';
import { generateSignedUrl } from '../oss/signedUrlService';

export interface CertificateTemplateField {
  key: string;
  label: string;
  x: number;
  y: number;
  fontSize: number;
  align: 'left' | 'center' | 'right';
  fontFamily: string;
  color: string;
  fontWeight: 'normal' | 'bold';
  text?: string;
}

export interface CertificateTemplatePayload {
  template_name: string;
  template_key: string;
  template_usage?: string;
  activate_now?: boolean;
  canvas_width: number;
  canvas_height: number;
  fields_json: CertificateTemplateField[];
  enabled?: number;
  schema_version?: number;
  render_mode?: string;
}

const DEFAULT_TEMPLATE_USAGE = 'service_hours';

function validateTemplateUsage(usage?: string) {
  const normalized = String(usage || DEFAULT_TEMPLATE_USAGE).trim();
  if (!/^[a-z][a-z0-9_]{1,31}$/i.test(normalized)) {
    throw { status: HTTP_STATUS.BAD_REQUEST, message: 'template_usage 格式不合法（建议如 service_hours）' };
  }
  return normalized.toLowerCase();
}

async function activateTemplateExclusively(templateId: number) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [rows] = await connection.query<any[]>(
      `SELECT template_id, template_usage FROM certificate_templates WHERE template_id = ? LIMIT 1`,
      [templateId]
    );
    const target = rows?.[0];
    if (!target) {
      throw { status: HTTP_STATUS.NOT_FOUND, message: '模板不存在' };
    }

    const usage = String(target.template_usage || DEFAULT_TEMPLATE_USAGE).trim().toLowerCase();

    await connection.query(
      `UPDATE certificate_templates
       SET enabled = 0
       WHERE template_usage = ? AND template_id <> ? AND enabled = 1`,
      [usage, templateId]
    );

    await connection.query(
      `UPDATE certificate_templates
       SET enabled = 1
       WHERE template_id = ?`,
      [templateId]
    );

    await connection.commit();
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

function validateFields(fields: CertificateTemplateField[]) {
  if (!Array.isArray(fields) || fields.length === 0) {
    throw { status: HTTP_STATUS.BAD_REQUEST, message: 'fields_json 必须为非空数组' };
  }

  const seen = new Set<string>();
  for (const field of fields) {
    if (!field.key || typeof field.key !== 'string') {
      throw { status: HTTP_STATUS.BAD_REQUEST, message: '字段 key 不能为空' };
    }
    if (seen.has(field.key)) {
      throw { status: HTTP_STATUS.BAD_REQUEST, message: `字段 key 重复：${field.key}` };
    }
    seen.add(field.key);

    if (!['left', 'center', 'right'].includes(field.align)) {
      throw { status: HTTP_STATUS.BAD_REQUEST, message: `字段 align 无效：${field.key}` };
    }
    if (!['normal', 'bold'].includes(field.fontWeight)) {
      throw { status: HTTP_STATUS.BAD_REQUEST, message: `字段 fontWeight 无效：${field.key}` };
    }
    if (Number(field.x) < 0 || Number(field.y) < 0 || Number(field.fontSize) < 8) {
      throw { status: HTTP_STATUS.BAD_REQUEST, message: `字段坐标或字号无效：${field.key}` };
    }
  }
}

function normalizeTemplateRow(row: any) {
  return {
    ...row,
    fields_json: typeof row.fields_json === 'string'
      ? JSON.parse(row.fields_json)
      : row.fields_json,
  };
}

export const createCertificateTemplate = async (body: CertificateTemplatePayload) => {
  const {
    template_name,
    template_key,
    template_usage = DEFAULT_TEMPLATE_USAGE,
    activate_now = true,
    canvas_width,
    canvas_height,
    fields_json,
    enabled = 1,
    schema_version = 1,
    render_mode = 'contain'
  } = body;

  if (!template_name || template_name.length > 100) {
    throw { status: HTTP_STATUS.BAD_REQUEST, message: 'template_name 不能为空且长度不超过100' };
  }
  if (!template_key) {
    throw { status: HTTP_STATUS.BAD_REQUEST, message: 'template_key 不能为空' };
  }
  if (Number(canvas_width) <= 0 || Number(canvas_height) <= 0) {
    throw { status: HTTP_STATUS.BAD_REQUEST, message: 'canvas_width/canvas_height 必须大于0' };
  }

  const normalizedUsage = validateTemplateUsage(template_usage);
  validateFields(fields_json);

  const shouldActivateNow = activate_now !== false;
  const normalizedEnabled = shouldActivateNow ? 1 : (Number(enabled) ? 1 : 0);

  const result: any = await query(
    `INSERT INTO certificate_templates
      (template_name, template_key, template_usage, canvas_width, canvas_height, fields_json, enabled, schema_version, render_mode)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      template_name,
      template_key,
      normalizedUsage,
      Number(canvas_width),
      Number(canvas_height),
      JSON.stringify(fields_json),
      normalizedEnabled,
      Number(schema_version) || 1,
      render_mode || 'contain'
    ]
  );

  if (normalizedEnabled === 1) {
    await activateTemplateExclusively(result.insertId);
  }

  return getCertificateTemplateById(result.insertId);
};

export const getCertificateTemplateById = async (templateId: number) => {
  const [row]: any[] = await query(
    `SELECT * FROM certificate_templates WHERE template_id = ?`,
    [templateId]
  );

  if (!row) {
    throw { status: HTTP_STATUS.NOT_FOUND, message: '模板不存在' };
  }

  return normalizeTemplateRow(row);
};

export const getCertificateTemplatesPage = async (queryParams: PaginationQuery = {}) => {
  const { page = 1, pageSize = 10, keyword, enabled, template_usage } = queryParams as any;

  const pageNum = Number(page) || 1;
  const sizeNum = Number(pageSize) || 10;

  const conditions: string[] = [];
  const values: any[] = [];

  if (keyword) {
    conditions.push('template_name LIKE ?');
    values.push(`%${keyword}%`);
  }
  if (enabled !== undefined && enabled !== '') {
    conditions.push('enabled = ?');
    values.push(Number(enabled));
  }
  if (template_usage) {
    conditions.push('template_usage = ?');
    values.push(String(template_usage).trim().toLowerCase());
  }

  const whereSQL = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const countSql = `SELECT COUNT(*) as total FROM certificate_templates ${whereSQL}`;
  const [{ total }] = await query<any[]>(countSql, values);

  const rows = await query<any[]>(
    `SELECT * FROM certificate_templates ${whereSQL}
     ORDER BY updated_at DESC, template_id DESC
     LIMIT ? OFFSET ?`,
    [...values, sizeNum, (pageNum - 1) * sizeNum]
  );

  return {
    list: rows.map(normalizeTemplateRow),
    pagination: {
      page: pageNum,
      pageSize: sizeNum,
      total,
    }
  };
};

export const getCertificateTemplatesList = async (queryParams: any = {}) => {
  const { keyword, enabled, template_usage } = queryParams;
  const conditions: string[] = [];
  const values: any[] = [];

  if (keyword) {
    conditions.push('template_name LIKE ?');
    values.push(`%${keyword}%`);
  }
  if (enabled !== undefined && enabled !== '') {
    conditions.push('enabled = ?');
    values.push(Number(enabled));
  }
  if (template_usage) {
    conditions.push('template_usage = ?');
    values.push(String(template_usage).trim().toLowerCase());
  }

  const whereSQL = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const rows = await query<any[]>(
    `SELECT * FROM certificate_templates ${whereSQL}
     ORDER BY updated_at DESC, template_id DESC`,
    values
  );

  return {
    list: rows.map(normalizeTemplateRow),
    total: rows.length,
  };
};

export const updateCertificateTemplate = async (templateId: number, body: Partial<CertificateTemplatePayload>) => {
  const existing = await getCertificateTemplateById(templateId);

  const next = {
    ...existing,
    ...body,
  };

  if (!next.template_name || next.template_name.length > 100) {
    throw { status: HTTP_STATUS.BAD_REQUEST, message: 'template_name 不能为空且长度不超过100' };
  }
  if (!next.template_key) {
    throw { status: HTTP_STATUS.BAD_REQUEST, message: 'template_key 不能为空' };
  }
  if (Number(next.canvas_width) <= 0 || Number(next.canvas_height) <= 0) {
    throw { status: HTTP_STATUS.BAD_REQUEST, message: 'canvas_width/canvas_height 必须大于0' };
  }

  const normalizedUsage = validateTemplateUsage(next.template_usage);
  validateFields(next.fields_json);

  const shouldActivateNow = body.activate_now === true || Number(next.enabled) === 1;

  await query(
    `UPDATE certificate_templates
     SET template_name = ?, template_key = ?, template_usage = ?, canvas_width = ?, canvas_height = ?,
         fields_json = ?, enabled = ?, schema_version = ?, render_mode = ?
     WHERE template_id = ?`,
    [
      next.template_name,
      next.template_key,
      normalizedUsage,
      Number(next.canvas_width),
      Number(next.canvas_height),
      JSON.stringify(next.fields_json),
      Number(next.enabled) ? 1 : 0,
      Number(next.schema_version) || 1,
      next.render_mode || 'contain',
      templateId,
    ]
  );

  if (shouldActivateNow) {
    await activateTemplateExclusively(templateId);
  }

  return getCertificateTemplateById(templateId);
};

export const activateCertificateTemplate = async (templateId: number) => {
  const template = await getCertificateTemplateById(templateId);
  if (!template) {
    throw { status: HTTP_STATUS.NOT_FOUND, message: '模板不存在' };
  }

  await activateTemplateExclusively(templateId);
  return getCertificateTemplateById(templateId);
};

export const deleteCertificateTemplate = async (templateId: number) => {
  const [used]: any[] = await query(
    `SELECT cert_id FROM service_certificates WHERE template_id = ? LIMIT 1`,
    [templateId]
  );

  if (used) {
    throw { status: HTTP_STATUS.CONFLICT, message: '模板已被证书记录引用，无法删除' };
  }

  const result: any = await query(
    `DELETE FROM certificate_templates WHERE template_id = ?`,
    [templateId]
  );

  if (result.affectedRows === 0) {
    throw { status: HTTP_STATUS.NOT_FOUND, message: '模板不存在或已删除' };
  }

  return { message: '删除成功' };
};

export const getEnabledTemplateOrThrow = async (templateId?: number, usage?: string) => {
  const normalizedUsage = usage ? String(usage).trim().toLowerCase() : undefined;

  if (templateId) {
    const template = await getCertificateTemplateById(templateId);
    if (Number(template.enabled) !== 1) {
      throw { status: HTTP_STATUS.BAD_REQUEST, message: '模板未启用' };
    }
    if (normalizedUsage && String(template.template_usage || '').toLowerCase() !== normalizedUsage) {
      throw { status: HTTP_STATUS.BAD_REQUEST, message: `模板用途不匹配，要求：${normalizedUsage}` };
    }
    return template;
  }

  const values: any[] = [];
  const conditions: string[] = ['enabled = 1'];
  if (normalizedUsage) {
    conditions.push('template_usage = ?');
    values.push(normalizedUsage);
  }

  const [row]: any[] = await query(
    `SELECT * FROM certificate_templates WHERE ${conditions.join(' AND ')} ORDER BY updated_at DESC, template_id DESC LIMIT 1`,
    values
  );

  if (!row) {
    throw { status: HTTP_STATUS.NOT_FOUND, message: normalizedUsage ? `未找到启用的模板（用途：${normalizedUsage}）` : '未找到启用的证书模板' };
  }

  return normalizeTemplateRow(row);
};

export const getEnabledCertificateTemplatesForUser = async () => {
  const rows = await query<any[]>(
    `SELECT template_id, template_name, template_key, template_usage, canvas_width, canvas_height, updated_at
     FROM certificate_templates
     WHERE enabled = 1
     ORDER BY updated_at DESC, template_id DESC`
  );

  return {
    list: rows,
    total: rows.length,
  };
};

export const getCertificateTemplateDownloadUrl = async (templateId: number) => {
  const template = await getEnabledTemplateOrThrow(templateId);

  return {
    template_id: template.template_id,
    template_name: template.template_name,
    template_key: template.template_key,
    download_url: generateSignedUrl(template.template_key, 600),
  };
};
