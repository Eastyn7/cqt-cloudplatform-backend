import { query } from '../db';
import { HTTP_STATUS } from '../utils/response';

export interface PortraitProfile {
  studentId: string;
  name: string;
  college: string | null;
  major: string | null;
  avatarKey: string | null;
  skillTags: string[];
  totalHours: number;
}

export interface PortraitKpi {
  totalHours: number;
  activityCount: number;
  attendanceRate: number;
  totalRecordsHours: number;
}

export interface RadarItem {
  name: string;
  value: number;
}

export interface CalendarHeatmapItem {
  date: string;
  value: number;
}

export interface CategorySlice {
  name: string;
  value: number;
}

export interface RecentActivityItem {
  activity_id: number;
  activity_name: string;
  category: string | null;
  start_time: string | null;
  service_hours: number | null;
}

export interface UserPortraitData {
  profile: PortraitProfile;
  kpi: PortraitKpi;
  radarData: RadarItem[];
  calendarHeatmap: CalendarHeatmapItem[];
  categoryPie: CategorySlice[];
  recentActivities: RecentActivityItem[];
  portraitMeta: PortraitMeta;
}

interface PortraitDimensionConfig {
  name: string;
  keywords: string[];
  weight: number;
}

export type PortraitDegradeReason =
  | 'DIMENSION_QUERY_FAILED'
  | 'NO_ENABLED_DIMENSIONS'
  | 'INVALID_DIMENSION_CONFIG';

export interface PortraitMeta {
  dimensionSource: 'custom' | 'default';
  degraded: boolean;
  degradeReason: PortraitDegradeReason | null;
}

interface DimensionConfigResult {
  configs: PortraitDimensionConfig[];
  meta: PortraitMeta;
}

const DEFAULT_DIMENSIONS: PortraitDimensionConfig[] = [
  { name: '组织协调', keywords: ['组织', '管理', '策划', '统筹'], weight: 1 },
  { name: '爱心奉献', keywords: ['公益', '服务', '爱心', '帮扶', '支援'], weight: 1 },
  { name: '专业技能', keywords: ['专业', '技能', '技术', '培训', '讲解'], weight: 1 },
  { name: '沟通表达', keywords: ['宣传', '沟通', '外联', '主持', '宣讲'], weight: 1 },
  { name: '持续参与', keywords: [], weight: 1 }
];

function parseKeywords(raw: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(/[,，]/)
    .map(word => word.trim())
    .filter(Boolean);
}

function buildDefaultDimensionResult(reason: PortraitDegradeReason): DimensionConfigResult {
  return {
    configs: DEFAULT_DIMENSIONS,
    meta: {
      dimensionSource: 'default',
      degraded: true,
      degradeReason: reason
    }
  };
}

function isValidDimensionRow(row: any): boolean {
  const hasValidName = typeof row?.dimension_name === 'string' && row.dimension_name.trim().length > 0;
  const weightNum = Number(row?.weight);
  const hasValidWeight = !Number.isNaN(weightNum) && weightNum >= 0 && weightNum <= 10;
  return hasValidName && hasValidWeight;
}

async function getDimensionConfigs(): Promise<DimensionConfigResult> {
  try {
    const rows: any[] = await query(
      `SELECT dimension_name, keywords, weight
       FROM portrait_dimensions
       WHERE enabled = 1
       ORDER BY sort_order ASC, dimension_id ASC`
    );

    if (!rows || rows.length === 0) {
      return buildDefaultDimensionResult('NO_ENABLED_DIMENSIONS');
    }

    const hasInvalidRow = rows.some(row => !isValidDimensionRow(row));
    if (hasInvalidRow) {
      return buildDefaultDimensionResult('INVALID_DIMENSION_CONFIG');
    }

    return {
      configs: rows.map(row => ({
        name: row.dimension_name,
        keywords: parseKeywords(row.keywords),
        weight: Number(row.weight)
      })),
      meta: {
        dimensionSource: 'custom',
        degraded: false,
        degradeReason: null
      }
    };
  } catch {
    return buildDefaultDimensionResult('DIMENSION_QUERY_FAILED');
  }
}

function mapCategoryToDimension(category: string | null, configs: PortraitDimensionConfig[]): string {
  if (!configs.length) return '持续参与';
  if (!category) return configs[configs.length - 1].name;

  const text = category.toLowerCase();
  for (const config of configs) {
    if (config.keywords.some(keyword => keyword && text.includes(keyword.toLowerCase()))) {
      return config.name;
    }
  }

  return configs[configs.length - 1].name;
}

function normalizeRadarScores(scores: Record<string, number>, dimensionNames: string[]): RadarItem[] {
  const values = dimensionNames.map(dim => scores[dim] || 0);
  const maxValue = Math.max(1, ...values);

  return dimensionNames.map(dim => ({
    name: dim,
    value: Math.round((scores[dim] || 0) / maxValue * 100)
  }));
}

export const getUserPortrait = async (studentId: string): Promise<UserPortraitData> => {
  if (!studentId) {
    throw { status: HTTP_STATUS.BAD_REQUEST, message: 'student_id 不能为空' };
  }

  const [profileRow]: any = await query(
    `SELECT student_id, name, college, major, avatar_key, skill_tags, total_hours
     FROM auth_info WHERE student_id = ?`,
    [studentId]
  );

  if (!profileRow) {
    throw { status: HTTP_STATUS.NOT_FOUND, message: '用户不存在' };
  }

  const [activityCountRow]: any = await query(
    `SELECT COUNT(*) as count FROM activity_participants WHERE student_id = ?`,
    [studentId]
  );

  const [attendanceRow]: any = await query(
    `SELECT COUNT(*) as count FROM activity_participants WHERE student_id = ? AND signed_in = 1`,
    [studentId]
  );

  const [hoursRow]: any = await query(
    `SELECT SUM(service_hours) as total FROM activity_participants WHERE student_id = ?`,
    [studentId]
  );

  const totalCount = activityCountRow?.count || 0;
  const attendanceCount = attendanceRow?.count || 0;
  const totalRecordsHours = Number(hoursRow?.total || 0);
  const attendanceRate = totalCount === 0 ? 0 : Number((attendanceCount / totalCount).toFixed(4));

  const kpi: PortraitKpi = {
    totalHours: Number(profileRow.total_hours || 0),
    activityCount: totalCount,
    attendanceRate,
    totalRecordsHours: Math.round(totalRecordsHours * 10) / 10
  };

  const categoryRows: any[] = await query(
    `SELECT a.category, COUNT(*) as count, SUM(ap.service_hours) as hours
     FROM activity_participants ap
     LEFT JOIN activities a ON ap.activity_id = a.activity_id
     WHERE ap.student_id = ?
     GROUP BY a.category
     ORDER BY count DESC`,
    [studentId]
  );

  const { configs: dimensionConfigs, meta: portraitMeta } = await getDimensionConfigs();
  const radarScores: Record<string, number> = {};
  for (const row of categoryRows) {
    const dimension = mapCategoryToDimension(row.category, dimensionConfigs);
    const weight = dimensionConfigs.find(config => config.name === dimension)?.weight ?? 1;
    const score = (Number(row.count || 0) * 2 + Number(row.hours || 0)) * weight;
    radarScores[dimension] = (radarScores[dimension] || 0) + score;
  }

  const radarData = normalizeRadarScores(
    radarScores,
    dimensionConfigs.map(config => config.name)
  );

  const categoryPie: CategorySlice[] = (categoryRows || []).map((row: any) => ({
    name: row.category || '未分类',
    value: row.count || 0
  }));

  const calendarRows: any[] = await query(
    `SELECT DATE(a.start_time) as date, COUNT(*) as count
     FROM activity_participants ap
     LEFT JOIN activities a ON ap.activity_id = a.activity_id
     WHERE ap.student_id = ? AND a.start_time IS NOT NULL
     GROUP BY DATE(a.start_time)
     ORDER BY DATE(a.start_time) ASC`,
    [studentId]
  );

  const calendarHeatmap: CalendarHeatmapItem[] = (calendarRows || []).map(row => ({
    date: row.date,
    value: row.count || 0
  }));

  const recentActivities: RecentActivityItem[] = await query(
    `SELECT a.activity_id, a.activity_name, a.category, a.start_time, ap.service_hours
     FROM activity_participants ap
     LEFT JOIN activities a ON ap.activity_id = a.activity_id
     WHERE ap.student_id = ?
     ORDER BY a.start_time DESC
     LIMIT 10`,
    [studentId]
  );

  return {
    profile: {
      studentId: profileRow.student_id,
      name: profileRow.name,
      college: profileRow.college,
      major: profileRow.major,
      avatarKey: profileRow.avatar_key,
      skillTags: profileRow.skill_tags ? profileRow.skill_tags.split(',').map((tag: string) => tag.trim()).filter(Boolean) : [],
      totalHours: Number(profileRow.total_hours || 0)
    },
    kpi,
    radarData,
    calendarHeatmap,
    categoryPie,
    recentActivities,
    portraitMeta
  };
};
