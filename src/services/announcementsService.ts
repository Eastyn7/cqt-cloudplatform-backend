import { query } from '../db';
import { HTTP_STATUS } from '../utils/response';
import {
  AnnouncementWritable,
  AnnouncementWritableFields,
  AnnouncementRecord
} from '../types/dbTypes';
import { convertDocxToHtml } from '../utils/docxToHtml';
import { downloadFileFromOSS } from '../oss/downloadService';
import { deleteFileFromOSS } from '../oss/deleteService';
import fs from 'fs';

/** 创建公告（支持Word转HTML，自动映射可写字段，OSS存储附件） */
export const createAnnouncement = async (body: Partial<AnnouncementWritable>) => {
  if (!body.title) {
    throw { status: HTTP_STATUS.BAD_REQUEST, message: '标题不能为空' };
  }

  let content = body.content || '';

  // Word文件转HTML内容
  if (body.file_type === 'word' && body.file_key) {
    const localPath = await downloadFileFromOSS(body.file_key);
    content = await convertDocxToHtml(localPath);
    fs.unlinkSync(localPath);
  }

  // 构建可写入数据
  const writableBody: Partial<AnnouncementWritable> = {
    ...body,
    content,
    publish_time: body.publish_time || null,
    status: body.status ?? '草稿',
    file_type: body.file_type ?? 'none'
  };

  // 自动筛选可写字段
  const fields = AnnouncementWritableFields.filter(f => writableBody[f] !== undefined);
  const placeholders = fields.map(() => '?').join(', ');
  const values = fields.map(f => writableBody[f] ?? null);

  const sql = `
    INSERT INTO announcements (${fields.join(', ')})
    VALUES (${placeholders})
  `;

  const result: any = await query(sql, values);

  return {
    message: '公告创建成功',
    announcement_id: result.insertId
  };
};

/** 更新公告（支持OSS附件替换、Word转HTML，自动过滤可写字段） */
export const updateAnnouncement = async (
  announcement_id: number,
  body: Partial<AnnouncementWritable>
) => {
  const [existing]: AnnouncementRecord[] | any = await query(
    `SELECT * FROM announcements WHERE announcement_id = ?`,
    [announcement_id]
  );

  if (!existing) {
    throw { status: HTTP_STATUS.NOT_FOUND, message: '公告不存在' };
  }

  const updates: string[] = [];
  const values: any[] = [];

  // 替换OSS附件
  if (body.file_key && body.file_key !== existing.file_key) {
    // 删除旧附件
    if (existing.file_key) {
      await deleteFileFromOSS(existing.file_key);
    }

    // 新增附件字段
    updates.push(`file_url = ?`, `file_key = ?`, `file_type = ?`);
    values.push(body.file_url ?? null, body.file_key, body.file_type ?? 'none');

    // Word文件重新转HTML
    if (body.file_type === 'word') {
      const localPath = await downloadFileFromOSS(body.file_key);
      const htmlContent = await convertDocxToHtml(localPath);
      fs.unlinkSync(localPath);

      updates.push(`content = ?`);
      values.push(htmlContent);
    }
  }

  // 自动更新其他文本字段
  for (const key of AnnouncementWritableFields) {
    if (
      key !== 'file_url' &&
      key !== 'file_key' &&
      key !== 'file_type' &&
      body[key] !== undefined
    ) {
      updates.push(`${key} = ?`);
      values.push(body[key]);
    }
  }

  if (updates.length === 0) {
    throw { status: HTTP_STATUS.BAD_REQUEST, message: '没有可更新的字段' };
  }

  const sql = `UPDATE announcements SET ${updates.join(', ')} WHERE announcement_id = ?`;
  await query(sql, [...values, announcement_id]);

  return { message: '公告更新成功' };
};

/** 删除公告（连带删除OSS附件） */
export const deleteAnnouncement = async (announcement_id: number) => {
  const [existing]: any = await query(
    `SELECT * FROM announcements WHERE announcement_id = ?`,
    [announcement_id]
  );

  if (!existing) {
    throw { status: HTTP_STATUS.NOT_FOUND, message: '公告不存在' };
  }

  // 删除OSS附件
  if (existing.file_key) {
    await deleteFileFromOSS(existing.file_key);
  }

  await query(`DELETE FROM announcements WHERE announcement_id = ?`, [announcement_id]);

  return { message: '公告删除成功' };
};

/** 获取所有公告（关联届次信息，供后台使用） */
export const getAllAnnouncements = async () => {
  const sql = `
    SELECT 
      a.*,
      t.term_name,
      t.is_current
    FROM announcements a
    LEFT JOIN team_terms t ON a.term_id = t.term_id
    ORDER BY a.publish_time DESC
  `;
  const rows: any[] = await query(sql);

  return { total: rows.length, data: rows };
};

/** 获取已发布公告（关联届次信息，供门户展示） */
export const getPublishedAnnouncements = async () => {
  const sql = `
    SELECT 
      a.*,
      t.term_name
    FROM announcements a
    LEFT JOIN team_terms t ON a.term_id = t.term_id
    WHERE a.status = '已发布'
    ORDER BY a.publish_time DESC
  `;
  const rows: any[] = await query(sql);

  return { total: rows.length, data: rows };
};