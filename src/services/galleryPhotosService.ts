import { query } from '../db';
import { HTTP_STATUS } from '../utils/response';
import { deleteFileFromOSS } from '../oss/deleteService';
import {
  GalleryPhotoWritable,
  GalleryPhotoWritableFields,
  GalleryPhotoRecord
} from '../types/dbTypes';

/** 创建照片（OSS存储，必填image_url和image_key，自动映射可写字段） */
export const createPhoto = async (body: Partial<GalleryPhotoWritable>) => {
  if (!body.image_url || !body.image_key) {
    throw {
      status: HTTP_STATUS.BAD_REQUEST,
      message: 'image_url 和 image_key 不能为空'
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

  // 图片替换（需同时提供image_url和image_key）
  if (body.image_key && body.image_key !== existing.image_key) {
    if (!body.image_url) {
      throw {
        status: HTTP_STATUS.BAD_REQUEST,
        message: '修改图片时必须同时提供 image_url 和 image_key'
      };
    }

    // 删除旧图
    if (existing.image_key) {
      await deleteFileFromOSS(existing.image_key);
    }

    // 写入新图片信息
    updates.push('image_url = ?', 'image_key = ?', 'uploaded_by = ?');
    values.push(body.image_url, body.image_key, body.uploaded_by ?? null);
  }

  // 自动更新其他普通字段
  for (const key of GalleryPhotoWritableFields) {
    if (
      key !== 'image_url' &&
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

/** 获取全部照片（关联届次信息，供后台使用，按上传时间倒序） */
export const getAllPhotos = async () => {
  const sql = `
    SELECT p.*, t.term_name
    FROM gallery_photos p
    LEFT JOIN team_terms t ON p.term_id = t.term_id
    ORDER BY p.uploaded_at DESC
  `;

  const rows: any[] = await query(sql);
  return { total: rows.length, data: rows };
};

/** 按届次筛选照片（供门户展示，按上传时间倒序） */
export const getPhotosByTerm = async (term_id: number) => {
  const sql = `
    SELECT * FROM gallery_photos
    WHERE term_id = ?
    ORDER BY uploaded_at DESC
  `;

  const rows: GalleryPhotoRecord[] = await query(sql, [term_id]);
  return { total: rows.length, data: rows };
};

/** 按活动筛选照片（供门户展示，按上传时间倒序） */
export const getPhotosByActivity = async (activity_id: number) => {
  const sql = `
    SELECT * FROM gallery_photos
    WHERE activity_id = ?
    ORDER BY uploaded_at DESC
  `;

  const rows: GalleryPhotoRecord[] = await query(sql, [activity_id]);
  return { total: rows.length, data: rows };
};