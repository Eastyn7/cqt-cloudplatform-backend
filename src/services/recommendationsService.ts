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

interface UserProfile {
  student_id: string;
  college: string | null;
  major: string | null;
  skill_tags: string | null;
}

const MAX_CANDIDATES = 200;

function splitTags(raw: string | null): string[] {
  if (!raw) return [];
  return raw.split(/[,，]/).map(tag => tag.trim()).filter(Boolean);
}

function matchTags(text: string, tags: string[]): string[] {
  const lower = text.toLowerCase();
  return tags.filter(tag => tag && lower.includes(tag.toLowerCase()));
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

function scoreActivity(
  activity: any,
  categoryWeights: Record<string, number>,
  tags: string[]
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

  if (activity.start_time) {
    const startTime = new Date(activity.start_time).getTime();
    const now = Date.now();
    if (startTime >= now) {
      score += 0.5;
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
  const [profile, categoryWeights, joinedSet, activities] = await Promise.all([
    getUserProfile(studentId),
    getUserCategoryWeights(studentId),
    getJoinedActivityIds(studentId),
    getCandidateActivities()
  ]);

  const tags = splitTags(profile.skill_tags);
  const scored: RecommendationItem[] = [];

  for (const activity of activities) {
    if (joinedSet.has(Number(activity.activity_id))) continue;

    const { score, reasons } = scoreActivity(activity, categoryWeights, tags);
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
    list: result,
    total: result.length
  };
};

export const refreshUserRecommendations = async (studentId: string, limit: number = 10) => {
  return getUserRecommendations(studentId, limit);
};

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
    list: rows,
    pagination: {
      page: pageNum,
      pageSize: sizeNum,
      total,
    },
  };
};
