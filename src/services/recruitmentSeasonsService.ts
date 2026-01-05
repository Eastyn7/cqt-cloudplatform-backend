import { query } from '../db';
import { HTTP_STATUS } from '../utils/response';
import { RecruitmentSeasonRecord, RecruitmentType } from '../types/dbTypes';
import { PaginationQuery } from '../types/requestTypes';

/** 获取当前开启的报名通道（优先返回换届） */
export const getCurrentSeason = async (): Promise<RecruitmentSeasonRecord | null> => {
  const [row] = await query<RecruitmentSeasonRecord[]>(
    `SELECT * FROM recruitment_seasons 
     WHERE is_open = 1 
     ORDER BY FIELD(type, 'internal_election', 'new_student'), year DESC 
     LIMIT 1`
  );
  return row || null;
};

/** 获取所有通道列表（管理端用，分页） */
export const getSeasonList = async (queryParams: PaginationQuery = {}) => {
  const { page = 1, pageSize = 20, search } = queryParams;

  const pageNum = Number(page) || 1;
  const sizeNum = Number(pageSize) || 20;

  let sql = `SELECT * FROM recruitment_seasons`;

  const conditions: string[] = [];
  const values: any[] = [];

  if (search) {
    conditions.push('title LIKE ?');
    values.push(`%${search}%`);
  }

  const whereSQL = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  // 统计总数
  const countSql = `SELECT COUNT(*) as total FROM recruitment_seasons ${whereSQL}`;
  const [{ total }] = await query(countSql, values) as any[];

  // 分页查询
  sql += ` ${whereSQL} ORDER BY year DESC, type LIMIT ? OFFSET ?`;
  values.push(sizeNum, (pageNum - 1) * sizeNum);

  const list = await query<RecruitmentSeasonRecord[]>(sql, values);

  return {
    list,
    pagination: {
      page: pageNum,
      pageSize: sizeNum,
      total,
    },
  };
};

/** 开启报名通道 */
export const openSeason = async (body: any) => {
  const { year, type, title, start_time, end_time } = body;

  await query(
    `INSERT INTO recruitment_seasons 
     (year, type, is_open, title, start_time, end_time)
     VALUES (?, ?, 1, ?, ?, ?)
     ON DUPLICATE KEY UPDATE 
       is_open = 1, title = VALUES(title), start_time = VALUES(start_time), end_time = VALUES(end_time)`,
    [year, type, title, start_time || null, end_time || null]
  );

  return { message: `已开启 ${title}` };
};

/** 关闭所有通道（一键关闭） */
export const closeAllSeasons = async () => {
  await query('UPDATE recruitment_seasons SET is_open = 0');
  return { message: '已关闭所有报名通道' };
};

/** 关闭指定通道 */
export const closeSeason = async (year: number, type: string) => {
  await query(
    'UPDATE recruitment_seasons SET is_open = 0 WHERE year = ? AND type = ?',
    [year, type]
  );
  return { message: '已关闭该报名通道' };
};

/** 删除某个报名通道（仅在关闭状态下可删，用于清理错误配置） */
export const deleteSeason = async (year: number, type: RecruitmentType) => {
  const [exist] = await query<any[]>(
    'SELECT id, is_open FROM recruitment_seasons WHERE year = ? AND type = ?',
    [year, type]
  );

  if (!exist) {
    throw {
      status: HTTP_STATUS.NOT_FOUND,
      message: '该报名通道不存在'
    };
  }

  if (exist.is_open === 1) {
    throw {
      status: HTTP_STATUS.BAD_REQUEST,
      message: '请先关闭该报名通道后再删除'
    };
  }

  await query(
    'DELETE FROM recruitment_seasons WHERE year = ? AND type = ?',
    [year, type]
  );

  return {
    message: `已删除 ${year} 年 ${type === 'new_student' ? '新生纳新' : '换届竞选'} 配置`
  };
};