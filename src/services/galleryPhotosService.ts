import { query } from '../db';
import { HTTP_STATUS } from '../utils/response';
import { deleteFileFromOSS } from '../oss/deleteService';
import {
  GalleryPhotoWritable,
  GalleryPhotoWritableFields,
  GalleryPhotoRecord
} from '../types/dbTypes';
import { PaginationQuery } from '../types/requestTypes';

/** 创建照片（OSS存储，必填image_key，自动映射可写字段） */
export const createPhoto = async (body: Partial<GalleryPhotoWritable>) => {
  if (!body.image_key) {
    throw {
      status: HTTP_STATUS.BAD_REQUEST,
      message: 'image_key 不能为空'
    };
  }

  // 自动构建插入字段与值
  const fields = GalleryPhotoWritableFields;
  const values = fields.map(f => body[f] ?? null);

  const sql = `
    INSERT INTO gallery_photos (${fields.join(', ')})
    VALUES (${fields.map(() => '?').join(', ')})
  `;

  const result: any = await query(sql, values);

  return { message: '照片上传成功', photo_id: result.insertId };
};

/** 更新照片（支持OSS图片替换，自动过滤可写字段） */
export const updatePhoto = async (
  photo_id: number,
  body: Partial<GalleryPhotoWritable>
) => {
  const [existing]: GalleryPhotoRecord[] = await query(
    `SELECT * FROM gallery_photos WHERE photo_id = ?`,
    [photo_id]
  );

  if (!existing) {
    throw { status: HTTP_STATUS.NOT_FOUND, message: '照片不存在' };
  }

  const updates: string[] = [];
  const values: any[] = [];

  // 图片替换（需提供image_key）
  if (body.image_key && body.image_key !== existing.image_key) {
    // 删除旧图
    if (existing.image_key) {
      await deleteFileFromOSS(existing.image_key);
    }

    // 写入新图片信息
    updates.push('image_key = ?', 'uploaded_by = ?');
    values.push(body.image_key, body.uploaded_by ?? null);
  }

  // 自动更新其他普通字段
  for (const key of GalleryPhotoWritableFields) {
    if (
      key !== 'image_key' &&
      body[key] !== undefined
    ) {
      updates.push(`${key} = ?`);
      values.push(body[key]);
    }
  }

  if (updates.length === 0) {
    throw { status: HTTP_STATUS.BAD_REQUEST, message: '没有可更新字段' };
  }

  const sql = `UPDATE gallery_photos SET ${updates.join(', ')} WHERE photo_id = ?`;
  await query(sql, [...values, photo_id]);

  return { message: '照片更新成功' };
};

/** 删除照片（连带删除OSS图片文件） */
export const deletePhoto = async (photo_id: number) => {
  const [existing]: GalleryPhotoRecord[] = await query(
    `SELECT * FROM gallery_photos WHERE photo_id = ?`,
    [photo_id]
  );

  if (!existing) {
    throw { status: HTTP_STATUS.NOT_FOUND, message: '照片不存在' };
  }

  // 删除OSS图片
  if (existing.image_key) {
    await deleteFileFromOSS(existing.image_key);
  }

  await query(`DELETE FROM gallery_photos WHERE photo_id = ?`, [photo_id]);

  return { message: '照片删除成功' };
};

/** 获取所有照片（分页，支持搜索 + 届次筛选） */
export const getAllPhotosPage = async (
  queryParams: PaginationQuery = {}
) => {
  const {
    page = 1,
    pageSize = 20,
    search,
    term_id,
  } = queryParams as any;

  const pageNum = Number(page) || 1;
  const sizeNum = Number(pageSize) || 20;

  const conditions: string[] = [];
  const values: any[] = [];

  // search：照片名称 + 描述
  if (search) {
    conditions.push(`
      (
        p.title LIKE ?
        OR p.description LIKE ?
      )
    `);
    values.push(`%${search}%`, `%${search}%`);
  }

  // 届次筛选
  if (term_id) {
    conditions.push('p.term_id = ?');
    values.push(term_id);
  }

  const whereSQL = conditions.length
    ? `WHERE ${conditions.join(' AND ')}`
    : '';

  // 统计总数
  const countSql = `
    SELECT COUNT(*) as total
    FROM gallery_photos p
    ${whereSQL}
  `;
  const [{ total }] = (await query(countSql, values)) as any[];

  // 分页查询
  const sql = `
    SELECT 
      p.*,
      t.term_name
    FROM gallery_photos p
    LEFT JOIN team_terms t ON p.term_id = t.term_id
    ${whereSQL}
    ORDER BY p.uploaded_at DESC
    LIMIT ? OFFSET ?
  `;

  values.push(sizeNum, (pageNum - 1) * sizeNum);
  const rows = await query(sql, values);

  return {
    list: rows,
    pagination: {
      page: pageNum,
      pageSize: sizeNum,
      total,
    },
  };
};

/** 按届次筛选照片（分页） */
export const getPhotosByTermPage = async (
  term_id: number,
  queryParams: PaginationQuery = {}
) => {
  const { page = 1, pageSize = 20, search } = queryParams as any;

  const pageNum = Number(page) || 1;
  const sizeNum = Number(pageSize) || 20;

  const conditions: string[] = ['p.term_id = ?'];
  const values: any[] = [term_id];

  if (search) {
    conditions.push('p.description LIKE ?');
    values.push(`%${search}%`);
  }

  const whereSQL = `WHERE ${conditions.join(' AND ')}`;

  // 统计总数
  const countSql = `
    SELECT COUNT(*) as total
    FROM gallery_photos p
    ${whereSQL}
  `;
  const [{ total }] = (await query(countSql, values)) as any[];

  // 分页查询
  const sql = `
    SELECT p.*
    FROM gallery_photos p
    ${whereSQL}
    ORDER BY p.uploaded_at DESC
    LIMIT ? OFFSET ?
  `;

  values.push(sizeNum, (pageNum - 1) * sizeNum);
  const rows: GalleryPhotoRecord[] = await query(sql, values);

  return {
    list: rows,
    pagination: {
      page: pageNum,
      pageSize: sizeNum,
      total,
    },
  };
};

/** 按活动筛选照片（分页） */
export const getPhotosByActivityPage = async (
  activity_id: number,
  queryParams: PaginationQuery = {}
) => {
  const { page = 1, pageSize = 20, search } = queryParams as any;

  const pageNum = Number(page) || 1;
  const sizeNum = Number(pageSize) || 20;

  const conditions: string[] = ['p.activity_id = ?'];
  const values: any[] = [activity_id];

  if (search) {
    conditions.push('p.description LIKE ?');
    values.push(`%${search}%`);
  }

  const whereSQL = `WHERE ${conditions.join(' AND ')}`;

  // 统计总数
  const countSql = `
    SELECT COUNT(*) as total
    FROM gallery_photos p
    ${whereSQL}
  `;
  const [{ total }] = (await query(countSql, values)) as any[];

  // 分页查询
  const sql = `
    SELECT p.*
    FROM gallery_photos p
    ${whereSQL}
    ORDER BY p.uploaded_at DESC
    LIMIT ? OFFSET ?
  `;

  values.push(sizeNum, (pageNum - 1) * sizeNum);
  const rows: GalleryPhotoRecord[] = await query(sql, values);

  return {
    list: rows,
    pagination: {
      page: pageNum,
      pageSize: sizeNum,
      total,
    },
  };
};