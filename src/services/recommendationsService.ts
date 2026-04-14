import { query } from '../db';
import { HTTP_STATUS } from '../utils/response';
import { PaginationQuery } from '../types/requestTypes';

export interface RecommendationItem {
  activity_id: number;
  activity_name: string;
  category: string | null;
  start_time: string | null;
  end_time: string | null;
  signup_start_time: string | null;
  signup_end_time: string | null;
  location: string | null;
  service_hours: number;
  score: number;
  reasons: string[];
}

export interface RecommendationStrategy {
  strategy_key: string;
  strategy_name: string;
  enabled: boolean;
  priority_categories: string[];
  category_boost: number;
  pinned_activity_ids: number[];
  pinned_boost: number;
  priority_keywords: string[];
  keyword_boost: number;
  time_boost: number;
  remarks: string | null;
  created_at?: string;
  updated_at?: string;
}

interface RecommendationStrategyRow {
  strategy_id: number;
  strategy_key: string;
  strategy_name: string;
  enabled: number;
  priority_categories: string | null;
  category_boost: number;
  pinned_activity_ids: string | null;
  pinned_boost: number;
  priority_keywords: string | null;
  keyword_boost: number;
  time_boost: number;
  remarks: string | null;
  created_at: string;
  updated_at: string;
}

interface UserProfile {
  student_id: string;
  college: string | null;
  major: string | null;
  skill_tags: string | null;
}

interface RecommendationStrategyUpdateBody {
  strategy_name?: string;
  enabled?: boolean | number;
  priority_categories?: string[];
  category_boost?: number;
  pinned_activity_ids?: number[];
  pinned_boost?: number;
  priority_keywords?: string[];
  keyword_boost?: number;
  time_boost?: number;
  remarks?: string | null;
}

const MAX_CANDIDATES = 200;
const DEFAULT_STRATEGY_KEY = 'default';
const BOOST_MIN = 0;
const BOOST_MAX = 10;

const DEFAULT_STRATEGY: RecommendationStrategy = {
  strategy_key: DEFAULT_STRATEGY_KEY,
  strategy_name: '校园活动优先推荐',
  enabled: true,
  priority_categories: ['校园活动'],
  category_boost: 5,
  pinned_activity_ids: [],
  pinned_boost: 8,
  priority_keywords: ['校园', '主题活动'],
  keyword_boost: 2,
  time_boost: 1,
  remarks: '默认推荐策略',
};

function splitTags(raw: string | null): string[] {
  if (!raw) return [];
  return raw.split(/[,，]/).map(tag => tag.trim()).filter(Boolean);
}

function matchTags(text: string, tags: string[]): string[] {
  const lower = text.toLowerCase();
  return tags.filter(tag => tag && lower.includes(tag.toLowerCase()));
}

function parseJsonArray<T>(raw: unknown, fallback: T[] = []): T[] {
  if (Array.isArray(raw)) {
    return raw.filter(item => item !== null && item !== undefined) as T[];
  }

  if (raw === null || raw === undefined) {
    return fallback;
  }

  if (typeof raw !== 'string') {
    return fallback;
  }

  const trimmed = raw.trim();
  if (!trimmed) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(trimmed);
    if (!Array.isArray(parsed)) {
      return fallback;
    }
    return parsed.filter(item => item !== null && item !== undefined) as T[];
  } catch {
    return fallback;
  }
}

function parseNumberArray(raw: unknown, fallback: number[] = []): number[] {
  return parseJsonArray(raw, fallback)
    .map(item => Number(item))
    .filter(item => Number.isFinite(item));
}

function parseBoolean(raw: unknown, fallback = true): boolean {
  if (typeof raw === 'boolean') return raw;
  if (raw === 1 || raw === '1') return true;
  if (raw === 0 || raw === '0') return false;
  return fallback;
}

function normalizeNumber(raw: unknown, fallback: number): number {
  const value = Number(raw);
  if (!Number.isFinite(value)) return fallback;
  const clamped = Math.max(BOOST_MIN, Math.min(BOOST_MAX, value));
  return Number(clamped.toFixed(2));
}

function normalizeStrategy(row: RecommendationStrategyRow | null): RecommendationStrategy {
  if (!row) {
    return { ...DEFAULT_STRATEGY };
  }

  return {
    strategy_key: row.strategy_key,
    strategy_name: row.strategy_name,
    enabled: parseBoolean(row.enabled, DEFAULT_STRATEGY.enabled),
    priority_categories: parseJsonArray<string>(row.priority_categories, DEFAULT_STRATEGY.priority_categories),
    category_boost: normalizeNumber(row.category_boost, DEFAULT_STRATEGY.category_boost),
    pinned_activity_ids: parseNumberArray(row.pinned_activity_ids, DEFAULT_STRATEGY.pinned_activity_ids),
    pinned_boost: normalizeNumber(row.pinned_boost, DEFAULT_STRATEGY.pinned_boost),
    priority_keywords: parseJsonArray<string>(row.priority_keywords, DEFAULT_STRATEGY.priority_keywords),
    keyword_boost: normalizeNumber(row.keyword_boost, DEFAULT_STRATEGY.keyword_boost),
    time_boost: normalizeNumber(row.time_boost, DEFAULT_STRATEGY.time_boost),
    remarks: row.remarks ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

async function getUserProfile(studentId: string): Promise<UserProfile> {
  const [row]: any = await query(
    `SELECT student_id, college, major, skill_tags
     FROM auth_info WHERE student_id = ?`,
    [studentId]
  );

  if (!row) {
    throw { status: HTTP_STATUS.NOT_FOUND, message: '用户不存在' };
  }

  return row as UserProfile;
}

async function getUserCategoryWeights(studentId: string) {
  const rows: any[] = await query(
    `SELECT a.category, COUNT(*) as count
     FROM activity_participants ap
     LEFT JOIN activities a ON ap.activity_id = a.activity_id
     WHERE ap.student_id = ?
     GROUP BY a.category`,
    [studentId]
  );

  const counts: Record<string, number> = {};
  let maxCount = 0;

  for (const row of rows) {
    const name = row.category || '未分类';
    const count = Number(row.count || 0);
    counts[name] = count;
    if (count > maxCount) maxCount = count;
  }

  const weights: Record<string, number> = {};
  Object.keys(counts).forEach(key => {
    weights[key] = maxCount === 0 ? 0 : Number((counts[key] / maxCount).toFixed(4));
  });

  return weights;
}

async function getJoinedActivityIds(studentId: string): Promise<Set<number>> {
  const rows: any[] = await query(
    `SELECT activity_id FROM activity_participants WHERE student_id = ?`,
    [studentId]
  );

  return new Set(rows.map(row => Number(row.activity_id)));
}

async function getCandidateActivities(): Promise<any[]> {
  return query(
    `SELECT activity_id, activity_name, category, start_time, end_time,
            signup_start_time, signup_end_time, location, description, service_hours
     FROM activities
     WHERE status = '进行中'
       AND (signup_start_time IS NULL OR signup_start_time <= NOW())
       AND (signup_end_time IS NULL OR signup_end_time >= NOW())
     ORDER BY start_time DESC
     LIMIT ?`,
    [MAX_CANDIDATES]
  );
}

async function getRecommendationStrategyRow(): Promise<RecommendationStrategyRow | null> {
  const rows: any[] = await query(
    `SELECT strategy_id, strategy_key, strategy_name, enabled, priority_categories,
            category_boost, pinned_activity_ids, pinned_boost, priority_keywords,
            keyword_boost, time_boost, remarks, created_at, updated_at
     FROM recommendation_strategy_config
     WHERE strategy_key = ?
     LIMIT 1`,
    [DEFAULT_STRATEGY_KEY]
  );

  return rows[0] ?? null;
}

export const getRecommendationStrategy = async () => {
  const row = await getRecommendationStrategyRow();
  return { strategy: normalizeStrategy(row) };
};

function buildStrategySaveSql() {
  return `
    INSERT INTO recommendation_strategy_config (
      strategy_key, strategy_name, enabled, priority_categories, category_boost,
      pinned_activity_ids, pinned_boost, priority_keywords, keyword_boost,
      time_boost, remarks
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      strategy_name = VALUES(strategy_name),
      enabled = VALUES(enabled),
      priority_categories = VALUES(priority_categories),
      category_boost = VALUES(category_boost),
      pinned_activity_ids = VALUES(pinned_activity_ids),
      pinned_boost = VALUES(pinned_boost),
      priority_keywords = VALUES(priority_keywords),
      keyword_boost = VALUES(keyword_boost),
      time_boost = VALUES(time_boost),
      remarks = VALUES(remarks),
      updated_at = CURRENT_TIMESTAMP
  `;
}

export const updateRecommendationStrategy = async (body: RecommendationStrategyUpdateBody) => {
  const current = normalizeStrategy(await getRecommendationStrategyRow());
  const next: RecommendationStrategy = {
    ...current,
    ...body,
    strategy_key: DEFAULT_STRATEGY_KEY,
    strategy_name: body.strategy_name ?? current.strategy_name,
    enabled: body.enabled === undefined ? current.enabled : parseBoolean(body.enabled, current.enabled),
    priority_categories: body.priority_categories ?? current.priority_categories,
    category_boost: body.category_boost === undefined ? current.category_boost : normalizeNumber(body.category_boost, current.category_boost),
    pinned_activity_ids: body.pinned_activity_ids ?? current.pinned_activity_ids,
    pinned_boost: body.pinned_boost === undefined ? current.pinned_boost : normalizeNumber(body.pinned_boost, current.pinned_boost),
    priority_keywords: body.priority_keywords ?? current.priority_keywords,
    keyword_boost: body.keyword_boost === undefined ? current.keyword_boost : normalizeNumber(body.keyword_boost, current.keyword_boost),
    time_boost: body.time_boost === undefined ? current.time_boost : normalizeNumber(body.time_boost, current.time_boost),
    remarks: body.remarks !== undefined ? body.remarks : current.remarks,
  };

  await query(buildStrategySaveSql(), [
    next.strategy_key,
    next.strategy_name,
    next.enabled ? 1 : 0,
    JSON.stringify(next.priority_categories),
    next.category_boost,
    JSON.stringify(next.pinned_activity_ids),
    next.pinned_boost,
    JSON.stringify(next.priority_keywords),
    next.keyword_boost,
    next.time_boost,
    next.remarks,
  ]);

  return getRecommendationStrategy();
};

function scoreActivity(
  activity: any,
  categoryWeights: Record<string, number>,
  tags: string[],
  strategy: RecommendationStrategy
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  const categoryName = activity.category || '未分类';
  const categoryWeight = categoryWeights[categoryName] || 0;
  if (categoryWeight > 0) {
    const categoryScore = Number((categoryWeight * 5).toFixed(2));
    score += categoryScore;
    reasons.push(`活动类型匹配(${categoryName})`);
  }

  const text = `${activity.activity_name || ''} ${activity.description || ''}`.trim();
  if (text && tags.length > 0) {
    const matchedTags = matchTags(text, tags).slice(0, 3);
    if (matchedTags.length > 0) {
      score += matchedTags.length;
      reasons.push(`技能标签匹配(${matchedTags.join('、')})`);
    }
  }

  if (strategy.enabled) {
    if (strategy.priority_categories.includes(categoryName)) {
      score += strategy.category_boost;
      reasons.push(`管理员优先类别(${categoryName})`);
    }

    const activityId = Number(activity.activity_id);
    if (strategy.pinned_activity_ids.includes(activityId)) {
      score += strategy.pinned_boost;
      reasons.push('管理员置顶推荐');
    }

    if (text && strategy.priority_keywords.length > 0) {
      const lowerText = text.toLowerCase();
      const matchedKeywords = strategy.priority_keywords.filter(keyword =>
        keyword && lowerText.includes(keyword.toLowerCase())
      ).slice(0, 3);

      if (matchedKeywords.length > 0) {
        score += Number((matchedKeywords.length * strategy.keyword_boost).toFixed(2));
        reasons.push(`推广关键词命中(${matchedKeywords.join('、')})`);
      }
    }
  }

  if (activity.start_time) {
    const startTime = new Date(activity.start_time).getTime();
    const now = Date.now();
    if (startTime >= now) {
      score += strategy.enabled ? strategy.time_boost : DEFAULT_STRATEGY.time_boost;
      reasons.push('即将开始');
    }
  }

  return { score: Number(score.toFixed(2)), reasons };
}

async function saveRecommendations(studentId: string, items: RecommendationItem[]) {
  if (items.length === 0) return;

  const values: any[] = [];
  const placeholders: string[] = [];

  for (const item of items) {
    placeholders.push('(?, ?, ?, ?)');
    values.push(
      studentId,
      item.activity_id,
      item.score,
      JSON.stringify(item.reasons || [])
    );
  }

  const sql = `
    INSERT INTO activity_recommendations (student_id, activity_id, score, reasons)
    VALUES ${placeholders.join(', ')}
    ON DUPLICATE KEY UPDATE
      score = VALUES(score),
      reasons = VALUES(reasons),
      updated_at = CURRENT_TIMESTAMP
  `;

  await query(sql, values);
}

export const getUserRecommendations = async (studentId: string, limit: number = 10) => {
  if (!studentId) {
    throw { status: HTTP_STATUS.BAD_REQUEST, message: 'student_id 不能为空' };
  }

  const safeLimit = Math.max(1, Math.min(Number(limit) || 10, 50));
  const [profile, categoryWeights, joinedSet, activities, strategyResult] = await Promise.all([
    getUserProfile(studentId),
    getUserCategoryWeights(studentId),
    getJoinedActivityIds(studentId),
    getCandidateActivities(),
    getRecommendationStrategy()
  ]);

  const tags = splitTags(profile.skill_tags);
  const scored: RecommendationItem[] = [];

  for (const activity of activities) {
    if (joinedSet.has(Number(activity.activity_id))) continue;

    const { score, reasons } = scoreActivity(activity, categoryWeights, tags, strategyResult.strategy);
    scored.push({
      activity_id: Number(activity.activity_id),
      activity_name: activity.activity_name,
      category: activity.category,
      start_time: activity.start_time,
      end_time: activity.end_time,
      signup_start_time: activity.signup_start_time,
      signup_end_time: activity.signup_end_time,
      location: activity.location,
      service_hours: Number(activity.service_hours || 0),
      score,
      reasons
    });
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const timeA = a.start_time ? new Date(a.start_time).getTime() : 0;
    const timeB = b.start_time ? new Date(b.start_time).getTime() : 0;
    return timeB - timeA;
  });

  const result = scored.slice(0, safeLimit);
  await saveRecommendations(studentId, result);

  return {
    profile: {
      student_id: profile.student_id,
      college: profile.college,
      major: profile.major,
      skill_tags: tags
    },
    strategy: strategyResult.strategy,
    list: result,
    total: result.length
  };
};

export const refreshUserRecommendations = async (studentId: string, limit: number = 10) => {
  return getUserRecommendations(studentId, limit);
};

function parseReasons(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map(item => String(item)).filter(Boolean);
  }

  if (typeof raw !== 'string' || !raw.trim()) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.map(item => String(item)).filter(Boolean);
  } catch {
    return [];
  }
}

export const getRecommendationsPage = async (queryParams: PaginationQuery = {}) => {
  const { page = 1, pageSize = 20, student_id, activity_id } = queryParams as any;

  const pageNum = Number(page) || 1;
  const sizeNum = Number(pageSize) || 20;

  const conditions: string[] = [];
  const values: any[] = [];

  if (student_id) {
    conditions.push('r.student_id = ?');
    values.push(student_id);
  }

  if (activity_id) {
    conditions.push('r.activity_id = ?');
    values.push(Number(activity_id));
  }

  const whereSQL = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const countSql = `SELECT COUNT(*) as total FROM activity_recommendations r ${whereSQL}`;
  const [{ total }] = (await query(countSql, values)) as any[];

  const sql = `
    SELECT
      r.*, a.activity_name, a.category
    FROM activity_recommendations r
    LEFT JOIN activities a ON r.activity_id = a.activity_id
    ${whereSQL}
    ORDER BY r.updated_at DESC
    LIMIT ? OFFSET ?
  `;

  values.push(sizeNum, (pageNum - 1) * sizeNum);
  const rows: any[] = await query(sql, values);

  return {
    list: rows.map(row => ({
      ...row,
      reasons: parseReasons(row.reasons)
    })),
    pagination: {
      page: pageNum,
      pageSize: sizeNum,
      total,
    },
  };
};
