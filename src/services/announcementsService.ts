import { query } from '../db';
import { HTTP_STATUS } from '../utils/response';
import {
  AnnouncementWritable,
  AnnouncementWritableFields,
  AnnouncementRecord
} from '../types/dbTypes';
import { convertDocxToHtml } from '../utils/docxToHtml';
import { downloadFileFromOSS } from '../oss/downloadService';
import { deleteFileFromOSS, deleteFilesFromOSS } from '../oss/deleteService';
import fs from 'fs';
import { PaginationQuery } from '../types/requestTypes';

/** 创建公告（支持Word转HTML，自动映射可写字段，OSS存储附件） */
export const createAnnouncement = async (body: Partial<AnnouncementWritable>) => {
  if (!body.title) {
    throw { status: HTTP_STATUS.BAD_REQUEST, message: '标题不能为空' };
  }

  let content = body.content || '';
  let imageKeys: string[] = [];

  // Word文件转HTML + 收集图片key
  if (body.file_type === 'word' && body.file_key) {
    const localPath = await downloadFileFromOSS(body.file_key);
    try {
      const result = await convertDocxToHtml(localPath);
      content = result.html;
      imageKeys = result.imageKeys;
    } catch (err) {
      fs.unlinkSync(localPath);
      throw { status: HTTP_STATUS.INTERNAL_ERROR, message: 'Word 文档转换失败' };
    }
    fs.unlinkSync(localPath);
  }

  // 构建可写入数据
  const writableBody: Partial<AnnouncementWritable> = {
    ...body,
    content,
    image_keys: imageKeys.length > 0 ? JSON.stringify(imageKeys) : null,
    publish_time: body.publish_time || null,
    status: body.status ?? '草稿',
    file_type: body.file_type ?? 'none'
  };

  // 自动筛选可写字段
  const fields = AnnouncementWritableFields.filter(f => writableBody[f] !== undefined);

  const placeholders = fields.map(() => '?').join(', ');
  const values = fields.map(f => writableBody[f] ?? null);

  const sql = `INSERT INTO announcements (${fields.join(', ')}) VALUES (${placeholders})`;
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

  // 处理附件替换 + Word 重新转换
  if (body.file_key && body.file_key !== existing.file_key) {
    // 删除旧附件
    if (existing.file_key) await deleteFileFromOSS(existing.file_key);
    // 删除旧图片
    if (existing.image_keys) {
      try {
        const oldKeys = JSON.parse(existing.image_keys);
        if (oldKeys.length > 0) await deleteFilesFromOSS(oldKeys);
      } catch (e) { console.error('删除旧图片失败:', e); }
    }

    updates.push(`file_key = ?`, `file_type = ?`, `content = ?`, `image_keys = NULL`);
    values.push(body.file_key ?? null, body.file_type ?? 'none', body.content ?? '');

    if (body.file_type === 'word' && body.file_key) {
      const localPath = await downloadFileFromOSS(body.file_key);
      try {
        const { html, imageKeys } = await convertDocxToHtml(localPath);
        values[values.length - 1] = html; // 替换 content
        values.push(JSON.stringify(imageKeys.length > 0 ? imageKeys : null));
        updates.push(`image_keys = ?`);
      } finally {
        fs.unlinkSync(localPath);
      }
    } else {
      values.push(null); // image_keys = NULL
    }
  }

  // 自动更新其他文本字段
  for (const key of AnnouncementWritableFields) {
    if (
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

/** 删除公告（精准删除附件 + 所有图片） */
export const deleteAnnouncement = async (announcement_id: number) => {
  const [existing]: any = await query(
    `SELECT file_key, image_keys FROM announcements WHERE announcement_id = ?`,
    [announcement_id]
  );

  if (!existing) {
    throw { status: HTTP_STATUS.NOT_FOUND, message: '公告不存在' };
  }

  // 删除主附件
  if (existing.file_key) {
    await deleteFileFromOSS(existing.file_key).catch(() => { });
  }

  // 删除所有转换出的图片
  if (existing.image_keys) {
    try {
      const keys: string[] = JSON.parse(existing.image_keys);
      if (keys.length > 0) {
        await deleteFilesFromOSS(keys);
        console.log(`公告 ${announcement_id} 的 ${keys.length} 张图片已删除`);
      }
    } catch (e) {
      console.error('解析或删除图片失败:', e);
    }
  }

  await query(`DELETE FROM announcements WHERE announcement_id = ?`, [announcement_id]);

  return { message: '公告删除成功，所有相关文件已清理' };
};

/** 获取所有公告（全量，后台使用） */
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

  return {
    total: rows.length,
    data: rows,
  };
};

/** 分页查询公告（后台，支持筛选） */
export const getAnnouncementsPage = async (
  queryParams: PaginationQuery = {}
) => {
  const {
    page = 1,
    pageSize = 20,
    search,
    status,
  } = queryParams as any;

  const pageNum = Number(page) || 1;
  const sizeNum = Number(pageSize) || 20;

  const conditions: string[] = [];
  const values: any[] = [];

  if (search) {
    conditions.push(`
      (
        a.title LIKE ?
        OR t.term_name LIKE ?
        OR a.author LIKE ?
      )
    `);
    values.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  if (status) {
    conditions.push('a.status = ?');
    values.push(status);
  }

  const whereSQL = conditions.length
    ? `WHERE ${conditions.join(' AND ')}`
    : '';

  // 统计总数
  const countSql = `
    SELECT COUNT(*) as total
    FROM announcements a
    LEFT JOIN team_terms t ON a.term_id = t.term_id
    ${whereSQL}
  `;
  const [{ total }] = (await query(countSql, values)) as any[];

  // 分页查询
  const sql = `
    SELECT 
      a.*,
      t.term_name,
      t.is_current
    FROM announcements a
    LEFT JOIN team_terms t ON a.term_id = t.term_id
    ${whereSQL}
    ORDER BY a.publish_time DESC
    LIMIT ? OFFSET ?
  `;

  values.push(sizeNum, (pageNum - 1) * sizeNum);
  const rows: any[] = await query(sql, values);

  return {
    list: rows,
    pagination: {
      page: pageNum,
      pageSize: sizeNum,
      total,
    },
  };
};

/** 分页查询已发布公告（前台） */
export const getPublishedAnnouncementsPage = async (
  queryParams: PaginationQuery = {}
) => {
  const { page = 1, pageSize = 20, search } = queryParams as any;

  const pageNum = Number(page) || 1;
  const sizeNum = Number(pageSize) || 20;

  const conditions: string[] = [`a.status = '已发布'`];
  const values: any[] = [];

  if (search) {
    conditions.push('a.title LIKE ?');
    values.push(`%${search}%`);
  }

  const whereSQL = `WHERE ${conditions.join(' AND ')}`;

  // 统计总数
  const countSql = `
    SELECT COUNT(*) as total
    FROM announcements a
    ${whereSQL}
  `;
  const [{ total }] = (await query(countSql, values)) as any[];

  // 分页查询
  const sql = `
    SELECT 
      a.*,
      t.term_name
    FROM announcements a
    LEFT JOIN team_terms t ON a.term_id = t.term_id
    ${whereSQL}
    ORDER BY a.publish_time DESC
    LIMIT ? OFFSET ?
  `;

  values.push(sizeNum, (pageNum - 1) * sizeNum);
  const rows: any[] = await query(sql, values);

  return {
    list: rows,
    pagination: {
      page: pageNum,
      pageSize: sizeNum,
      total,
    },
  };
};