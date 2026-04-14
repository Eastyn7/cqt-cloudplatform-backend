import { query } from '../db';
import { HTTP_STATUS } from '../utils/response';
import {
  ActivityRecord,
  ActivityWritable,
  ActivityWritableFields
} from '../types/dbTypes';
import { PaginationQuery } from '../types/requestTypes';
import { getRecommendationStrategy } from './recommendationsService';

interface ActivityRecommendationMeta {
  is_pinned: boolean;
  is_priority_category: boolean;
  matched_keywords: string[];
  recommendation_score: number;
  recommendation_reasons: string[];
  strategy_name: string;
}

function normalizeText(value: string | null | undefined): string {
  return String(value || '').trim().toLowerCase();
}

function parseJsonArray(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(item => String(item)).filter(Boolean);
  if (typeof raw !== 'string') return [];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(item => String(item)).filter(Boolean);
  } catch {
    return [];
  }
}

function buildActivityRecommendationMeta(activity: any, strategy: any): ActivityRecommendationMeta {
  const categoryName = activity.category || '未分类';
  const text = normalizeText(`${activity.activity_name || ''} ${activity.description || ''}`);
  const priorityCategories = Array.isArray(strategy?.priority_categories)
    ? strategy.priority_categories
    : [];
  const pinnedActivityIds = Array.isArray(strategy?.pinned_activity_ids)
    ? strategy.pinned_activity_ids.map((item: any) => Number(item)).filter((item: number) => Number.isFinite(item))
    : [];
  const priorityKeywords = Array.isArray(strategy?.priority_keywords)
    ? strategy.priority_keywords
    : [];

  const isPinned = pinnedActivityIds.includes(Number(activity.activity_id));
  const isPriorityCategory = priorityCategories.includes(categoryName);
  const matchedKeywords = priorityKeywords
    .filter((keyword: string) => keyword && text.includes(normalizeText(keyword)))
    .slice(0, 3);

  let score = 0;
  const reasons: string[] = [];

  if (isPinned) {
    score += Number(strategy?.pinned_boost || 0);
    reasons.push('管理员置顶推荐');
  }

  if (isPriorityCategory) {
    score += Number(strategy?.category_boost || 0);
    reasons.push(`优先类别(${categoryName})`);
  }

  if (matchedKeywords.length > 0) {
    score += matchedKeywords.length * Number(strategy?.keyword_boost || 0);
    reasons.push(`关键词命中(${matchedKeywords.join('、')})`);
  }

  if (activity.start_time) {
    const startTime = new Date(activity.start_time).getTime();
    if (Number.isFinite(startTime) && startTime >= Date.now()) {
      score += Number(strategy?.time_boost || 0);
      reasons.push('即将开始');
    }
  }

  return {
    is_pinned: isPinned,
    is_priority_category: isPriorityCategory,
    matched_keywords: matchedKeywords,
    recommendation_score: Number(score.toFixed(2)),
    recommendation_reasons: reasons,
    strategy_name: strategy?.strategy_name || '默认推荐策略',
  };
}

async function getActivityRecommendationStrategy() {
  const result = await getRecommendationStrategy();
  return result.strategy;
}

function attachRecommendationMeta(rows: any[], strategy: any) {
  return rows.map((row, index) => ({
    ...row,
    recommendation_meta: buildActivityRecommendationMeta(row, strategy),
    recommendation_rank: index + 1,
  }));
}

function sortVisibleActivities(rows: any[], strategy: any) {
  return [...rows].sort((left, right) => {
    const leftMeta = buildActivityRecommendationMeta(left, strategy);
    const rightMeta = buildActivityRecommendationMeta(right, strategy);

    if (rightMeta.recommendation_score !== leftMeta.recommendation_score) {
      return rightMeta.recommendation_score - leftMeta.recommendation_score;
    }

    const leftStart = left.start_time ? new Date(left.start_time).getTime() : 0;
    const rightStart = right.start_time ? new Date(right.start_time).getTime() : 0;
    if (rightStart !== leftStart) {
      return rightStart - leftStart;
    }

    return Number(right.activity_id) - Number(left.activity_id);
  });
}

/** 创建志愿活动（自动映射可写字段，必填活动名称） */
export const createActivity = async (body: Partial<ActivityWritable>) => {
  if (!body.activity_name) {
    throw { status: HTTP_STATUS.BAD_REQUEST, message: '活动名称不能为空' };
  }

  // 筛选可写字段
  const fields = ActivityWritableFields.filter(key => body[key] !== undefined);
  const placeholders = fields.map(() => '?').join(', ');
  const sql = `
    INSERT INTO activities (${fields.join(', ')})
    VALUES (${placeholders})
  `;
  const values = fields.map(key => body[key] ?? null);

  const result = await query<{ insertId: number }>(sql, values);

  return {
    activity_id: result.insertId,
    activity_name: body.activity_name,
    service_hours: body.service_hours ?? null,
    status: body.status ?? '草稿'
  };
};

/** 更新志愿活动（自动过滤可写字段） */
export const updateActivity = async (
  activity_id: number,
  body: Partial<ActivityWritable>
) => {
  const [existing]: any = await query(
    `SELECT * FROM activities WHERE activity_id = ?`,
    [activity_id]
  );

  if (!existing) {
    throw { status: HTTP_STATUS.NOT_FOUND, message: '活动不存在' };
  }

  const updates: string[] = [];
  const values: any[] = [];

  for (const key of Object.keys(body) as (keyof ActivityWritable)[]) {
    if (ActivityWritableFields.includes(key) && body[key] !== undefined) {
      updates.push(`${key} = ?`);
      values.push(body[key]);
    }
  }

  if (updates.length === 0) {
    throw { status: HTTP_STATUS.BAD_REQUEST, message: '没有可更新字段' };
  }

  // 检查状态和时间的有效性
  const newStatus = body.status !== undefined ? body.status : existing.status;
  const newEndTime = body.end_time !== undefined ? body.end_time : existing.end_time;

  // 如果要设置为"进行中"，需要检查时间是否符合要求
  if (newStatus === '进行中' && newEndTime) {
    const now = new Date();
    const endTime = new Date(newEndTime);
    
    // 检查结束时间是否已经过了
    if (endTime < now) {
      throw {
        status: HTTP_STATUS.BAD_REQUEST,
        message: '活动已结束，无法设置为进行中状态'
      };
    }
  }

  await query(
    `UPDATE activities SET ${updates.join(', ')} WHERE activity_id = ?`,
    [...values, activity_id]
  );

  return {
    message: '活动更新成功',
    updated_fields: updates.map(u => u.split('=')[0].trim())
  };
};

/** 删除志愿活动 */
export const deleteActivity = async (activity_id: number) => {
  const [existing]: any = await query(
    `SELECT * FROM activities WHERE activity_id = ?`,
    [activity_id]
  );

  if (!existing) {
    throw { status: HTTP_STATUS.NOT_FOUND, message: '活动不存在' };
  }

  await query(`DELETE FROM activities WHERE activity_id = ?`, [activity_id]);

  return { message: '活动删除成功' };
};

/** 获取所有志愿活动（分页） */
export const getAllActivitiesPage = async (queryParams: any = {}) => {
  const { page = 1, pageSize = 20, search, status, category } = queryParams;

  const pageNum = Number(page) || 1;
  const sizeNum = Number(pageSize) || 20;

  let sql = `
    SELECT 
      a.*, d.dept_name, t.term_name
    FROM activities a
    LEFT JOIN departments d ON a.dept_id = d.dept_id
    LEFT JOIN team_terms t ON a.term_id = t.term_id
  `;

  const conditions: string[] = [];
  const values: any[] = [];

  if (search) {
    conditions.push('(a.activity_name LIKE ? OR d.dept_name LIKE ? OR a.location LIKE ?)');
    values.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  if (status) {
    conditions.push('a.status = ?');
    values.push(status);
  }

  if (category) {
    conditions.push('a.category LIKE ?');
    values.push(`%${category}%`);
  }

  const whereSQL = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const countSql = `
    SELECT COUNT(*) as total
    FROM activities a
    LEFT JOIN departments d ON a.dept_id = d.dept_id
    ${whereSQL}
  `;
  const [{ total }] = await query(countSql, values) as any[];

  sql += ` ${whereSQL} ORDER BY a.created_at DESC LIMIT ? OFFSET ?`;
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

/** 获取所有志愿活动（全量） */
export const getAllActivities = async () => {
  const sql = `
    SELECT 
      a.*, 
      d.dept_name, 
      t.term_name
    FROM activities a
    LEFT JOIN departments d ON a.dept_id = d.dept_id
    LEFT JOIN team_terms t ON a.term_id = t.term_id
    ORDER BY a.created_at DESC
  `;

  const rows: any[] = await query(sql);

  return {
    list: rows,
    total: rows.length,
  };
};

/** 获取全部活动的基础信息（用于下拉筛选，不分页） */
export const getAllActivityNames = async () => {
  const sql = `
    SELECT activity_id, activity_name, status
    FROM activities
    ORDER BY created_at DESC
  `;

  const rows: any[] = await query(sql);

  return {
    list: rows,
    total: rows.length,
  };
};

/** 按ID获取志愿活动详情（关联部门、届次信息） */
export const getActivityById = async (activity_id: number) => {
  const [row]: any = await query(
    `
    SELECT 
      a.*, d.dept_name, t.term_name
    FROM activities a
    LEFT JOIN departments d ON a.dept_id = d.dept_id
    LEFT JOIN team_terms t ON a.term_id = t.term_id
    WHERE a.activity_id = ?
    `,
    [activity_id]
  );

  if (!row) {
    throw { status: HTTP_STATUS.NOT_FOUND, message: '活动不存在' };
  }

  return row;
};

/** 切换志愿活动状态（支持：草稿、进行中、已结束） */
export const changeActivityStatus = async (
  activity_id: number,
  newStatus: ActivityRecord['status']
) => {
  const validStatuses: ActivityRecord['status'][] = ['草稿', '进行中', '已结束'];

  if (!validStatuses.includes(newStatus)) {
    throw { status: HTTP_STATUS.BAD_REQUEST, message: '非法状态值' };
  }

  const [existing]: any = await query(
    `SELECT * FROM activities WHERE activity_id = ?`,
    [activity_id]
  );

  if (!existing) {
    throw { status: HTTP_STATUS.NOT_FOUND, message: '活动不存在' };
  }

  // 如果要切换为"进行中"，需要检查时间是否符合要求
  if (newStatus === '进行中') {
    const now = new Date();
    const endTime = existing.end_time ? new Date(existing.end_time) : null;
    
    // 检查结束时间是否已经过了
    if (endTime && endTime < now) {
      throw {
        status: HTTP_STATUS.BAD_REQUEST,
        message: '活动已结束，无法切换为进行中状态'
      };
    }
  }

  await query(`UPDATE activities SET status = ? WHERE activity_id = ?`, [
    newStatus,
    activity_id
  ]);

  return { message: `活动状态已更新为：${newStatus}` };
};

/** 获取所有活动的活动类别 */
export const getActivityCategories = async () => {
  const sql = `SELECT DISTINCT category FROM activities WHERE category IS NOT NULL AND category != '' ORDER BY category`;
  const rows: any[] = await query(sql);
  const categories = rows.map((row: any) => row.category);
  return {
    list: categories,
    total: categories.length,
  };
};

/** 获取非草稿志愿活动（分页，公开用） */
export const getVisibleActivitiesPage = async (queryParams: any = {}) => {
  const { page = 1, pageSize = 20, search, status, category } = queryParams;

  const pageNum = Number(page) || 1;
  const sizeNum = Number(pageSize) || 20;

  let sql = `
    SELECT 
      a.*, d.dept_name, t.term_name
    FROM activities a
    LEFT JOIN departments d ON a.dept_id = d.dept_id
    LEFT JOIN team_terms t ON a.term_id = t.term_id
  `;

  const conditions: string[] = ['a.status != ?'];
  const values: any[] = ['草稿'];

  if (search) {
    conditions.push('(a.activity_name LIKE ? OR d.dept_name LIKE ? OR a.location LIKE ?)');
    values.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  if (status && status !== '草稿') {
    conditions.push('a.status = ?');
    values.push(status);
  }

  if (category) {
    conditions.push('a.category LIKE ?');
    values.push(`%${category}%`);
  }

  const whereSQL = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const countSql = `
    SELECT COUNT(*) as total
    FROM activities a
    LEFT JOIN departments d ON a.dept_id = d.dept_id
    ${whereSQL}
  `;
  const [{ total }] = await query(countSql, values) as any[];

  sql += ` ${whereSQL} ORDER BY a.created_at DESC LIMIT ? OFFSET ?`;
  values.push(sizeNum, (pageNum - 1) * sizeNum);

  const rows = await query(sql, values);
  const strategy = await getActivityRecommendationStrategy();
  const sortedRows = sortVisibleActivities(rows as any[], strategy);
  const list = attachRecommendationMeta(sortedRows, strategy);

  return {
    recommendation_strategy: {
      strategy_key: strategy.strategy_key,
      strategy_name: strategy.strategy_name,
      enabled: strategy.enabled,
      priority_categories: parseJsonArray(strategy.priority_categories),
      pinned_activity_ids: parseJsonArray(strategy.pinned_activity_ids).map(item => Number(item)).filter(item => Number.isFinite(item)),
      priority_keywords: parseJsonArray(strategy.priority_keywords),
      category_boost: strategy.category_boost,
      pinned_boost: strategy.pinned_boost,
      keyword_boost: strategy.keyword_boost,
      time_boost: strategy.time_boost,
    },
    list,
    pagination: {
      page: pageNum,
      pageSize: sizeNum,
      total,
    },
  };
};

/** 获取非草稿志愿活动（全量，公开用） */
export const getVisibleActivities = async () => {
  const sql = `
    SELECT 
      a.*, 
      d.dept_name, 
      t.term_name
    FROM activities a
    LEFT JOIN departments d ON a.dept_id = d.dept_id
    LEFT JOIN team_terms t ON a.term_id = t.term_id
    WHERE a.status != '草稿'
    ORDER BY a.created_at DESC
  `;

  const rows: any[] = await query(sql);
  const strategy = await getActivityRecommendationStrategy();
  const sortedRows = sortVisibleActivities(rows, strategy);
  const list = attachRecommendationMeta(sortedRows, strategy);

  return {
    recommendation_strategy: {
      strategy_key: strategy.strategy_key,
      strategy_name: strategy.strategy_name,
      enabled: strategy.enabled,
      priority_categories: parseJsonArray(strategy.priority_categories),
      pinned_activity_ids: parseJsonArray(strategy.pinned_activity_ids).map(item => Number(item)).filter(item => Number.isFinite(item)),
      priority_keywords: parseJsonArray(strategy.priority_keywords),
      category_boost: strategy.category_boost,
      pinned_boost: strategy.pinned_boost,
      keyword_boost: strategy.keyword_boost,
      time_boost: strategy.time_boost,
    },
    list,
    total: rows.length,
  };
};