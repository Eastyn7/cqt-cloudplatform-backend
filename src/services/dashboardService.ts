import { query } from '../db';
import { HTTP_STATUS } from '../utils/response';

/**
 * 数据驾驶舱服务
 * 负责处理所有dashboard统计数据的聚合和计算
 */

// ==================== 类型定义 ====================

export interface KpiMetrics {
  volunteerCount: {
    value: number;
    trend: number | null;
    trendDirection: 'up' | 'down' | null;
  };
  totalServiceHours: {
    value: number;
    trend: number | null;
    trendDirection: 'up' | 'down' | null;
  };
  honorCount: {
    value: number;
    trend: number | null;
    trendDirection: 'up' | 'down' | null;
  };
  ongoingActivityCount: {
    value: number;
    trend: number | null;
    trendDirection: 'up' | 'down' | null;
  };
}

export interface VolunteerTrendPoint {
  label: string;
  signup: number;
  attend: number;
  hours: number;
}

export interface ActivitySlice {
  name: string;
  value: number;
}

export interface MajorStat {
  name: string;
  hours: number;
  volunteerCount: number;
}

export interface TopVolunteer {
  studentId: string;
  name: string;
  department: string;
  hours: number;
  skills: string[];
}

export interface UpcomingActivity {
  activityId: number;
  title: string;
  startTime: string;
  endTime: string;
  participants: number;
  status: 'draft' | 'ongoing' | 'ending';
}

export interface DashboardData {
  kpiMetrics: KpiMetrics;
  volunteerTrend: VolunteerTrendPoint[];
  activityDistribution: ActivitySlice[];
  majorStats: MajorStat[];
  topVolunteers: TopVolunteer[];
  upcomingActivities: UpcomingActivity[];
}

// ==================== 时间计算工具函数 ====================

/**
 * 获取时间范围的开始和结束日期
 */
function getTimeRange(timeRange: string = '30d') {
  const now = new Date();
  const endDate = new Date(now);
  endDate.setHours(23, 59, 59, 999);

  let startDate: Date;

  switch (timeRange) {
    case '30d':
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 30);
      startDate.setHours(0, 0, 0, 0);
      break;

    case '90d':
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 90);
      startDate.setHours(0, 0, 0, 0);
      break;

    case '1y':
      startDate = new Date(now.getFullYear(), 0, 1);
      break;

    case 'all':
      // 'all'时设置为一个很早的日期
      startDate = new Date('1900-01-01');
      break;

    default:
      throw { status: HTTP_STATUS.BAD_REQUEST, message: 'timeRange 参数无效，仅支持 30d / 90d / 1y / all' };
  }

  return {
    startDate,
    endDate,
    timeRange
  };
}

/**
 * 获取上一个时间范围
 */
function getPreviousTimeRange(timeRange: string = '30d') {
  const now = new Date();

  let startDate: Date;
  let endDate: Date;

  switch (timeRange) {
    case '30d':
      endDate = new Date(now);
      endDate.setDate(endDate.getDate() - 30);
      endDate.setHours(23, 59, 59, 999);

      startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - 30);
      startDate.setHours(0, 0, 0, 0);
      break;

    case '90d':
      endDate = new Date(now);
      endDate.setDate(endDate.getDate() - 90);
      endDate.setHours(23, 59, 59, 999);

      startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - 90);
      startDate.setHours(0, 0, 0, 0);
      break;

    case '1y':
      const currentYear = now.getFullYear();
      startDate = new Date(currentYear - 1, 0, 1);
      endDate = new Date(currentYear, 0, 0, 23, 59, 59, 999);
      break;

    case 'all':
      // all模式下不计算上一个范围
      return null;

    default:
      return null;
  }

  return { startDate, endDate };
}

/**
 * 格式化日期为 YYYY-MM-DD
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 计算趋势值和趋势方向
 */
function calculateTrend(current: number, previous: number | null, timeRange: string) {
  if (timeRange === 'all') {
    return {
      trend: 100,
      trendDirection: 'up' as const
    };
  }

  if (previous === null || previous === 0) {
    return {
      trend: null,
      trendDirection: null
    };
  }

  const trendValue = Number((((current - previous) / previous * 100).toFixed(1)));
  const trendDirection: 'up' | 'down' | null = trendValue > 0 ? 'up' : (trendValue < 0 ? 'down' : null);

  return {
    trend: trendValue,
    trendDirection
  };
}

// ==================== KPI 关键指标 ====================

/**
 * 获取KPI指标数据
 */
async function getKpiMetrics(timeRange: string = '30d'): Promise<KpiMetrics> {
  const { startDate, endDate } = getTimeRange(timeRange);
  const startStr = formatDate(startDate);
  const endStr = formatDate(endDate);

  // 获取上一时间段数据（用于计算趋势）
  let previousData: any = null;
  if (timeRange !== 'all') {
    const prevTimeRange = getPreviousTimeRange(timeRange);
    if (prevTimeRange) {
      const prevStartStr = formatDate(prevTimeRange.startDate);
      const prevEndStr = formatDate(prevTimeRange.endDate);

      const [volCount]: any = await query(
        `SELECT COUNT(DISTINCT student_id) as count FROM auth_info WHERE created_at BETWEEN ? AND ?`,
        [prevStartStr, prevEndStr]
      );
      const [svcHours]: any = await query(
        `SELECT SUM(service_hours) as total FROM activity_participants WHERE created_at BETWEEN ? AND ?`,
        [prevStartStr, prevEndStr]
      );
      const [honCount]: any = await query(
        `SELECT COUNT(*) as count FROM honor_records WHERE issue_date BETWEEN ? AND ?`,
        [prevStartStr, prevEndStr]
      );
      const [actCount]: any = await query(
        `SELECT COUNT(*) as count FROM activities WHERE status = '进行中' AND start_time BETWEEN ? AND ?`,
        [prevStartStr, prevEndStr]
      );

      previousData = {
        volunteerCount: volCount.count || 0,
        totalServiceHours: svcHours.total || 0,
        honorCount: honCount.count || 0,
        ongoingActivityCount: actCount.count || 0
      };
    }
  }

  // 获取当前时间段数据
  const [volCount]: any = await query(
    `SELECT COUNT(DISTINCT student_id) as count FROM auth_info WHERE created_at BETWEEN ? AND ?`,
    [startStr, endStr]
  );

  const [svcHours]: any = await query(
    `SELECT SUM(service_hours) as total FROM activity_participants WHERE created_at BETWEEN ? AND ?`,
    [startStr, endStr]
  );

  const [honCount]: any = await query(
    `SELECT COUNT(*) as count FROM honor_records WHERE issue_date BETWEEN ? AND ?`,
    [startStr, endStr]
  );

  const [actCount]: any = await query(
    `SELECT COUNT(*) as count FROM activities WHERE status = '进行中' AND start_time BETWEEN ? AND ?`,
    [startStr, endStr]
  );

  // 计算KPI指标及其趋势
  const volunteerCountValue = volCount.count || 0;
  const totalServiceHoursValue = svcHours.total || 0;
  const honorCountValue = honCount.count || 0;
  const ongoingActivityCountValue = actCount.count || 0;

  return {
    volunteerCount: {
      value: volunteerCountValue,
      ...calculateTrend(volunteerCountValue, previousData?.volunteerCount ?? null, timeRange)
    },
    totalServiceHours: {
      value: Math.round(totalServiceHoursValue * 10) / 10,
      ...calculateTrend(totalServiceHoursValue, previousData?.totalServiceHours ?? null, timeRange)
    },
    honorCount: {
      value: honorCountValue,
      ...calculateTrend(honorCountValue, previousData?.honorCount ?? null, timeRange)
    },
    ongoingActivityCount: {
      value: ongoingActivityCountValue,
      ...calculateTrend(ongoingActivityCountValue, previousData?.ongoingActivityCount ?? null, timeRange)
    }
  };
}

// ==================== 志愿者活跃度趋势 ====================

/**
 * 获取志愿者活跃度趋势
 */
async function getVolunteerTrend(timeRange: string = '30d'): Promise<VolunteerTrendPoint[]> {
  const { startDate, endDate } = getTimeRange(timeRange);

  let buckets: Array<{ label: string; start: Date; end: Date }> = [];

  if (timeRange === '30d') {
    // 分6个桶，每个桶5天
    for (let i = 0; i < 6; i++) {
      const start = new Date(startDate);
      start.setDate(start.getDate() + i * 5);
      const end = new Date(start);
      end.setDate(end.getDate() + 5);
      buckets.push({
        label: `第${i + 1}段`,
        start,
        end: end > endDate ? endDate : end
      });
    }
  } else if (timeRange === '90d') {
    // 分9个桶，每个桶10天
    for (let i = 0; i < 9; i++) {
      const start = new Date(startDate);
      start.setDate(start.getDate() + i * 10);
      const end = new Date(start);
      end.setDate(end.getDate() + 10);
      buckets.push({
        label: `第${i + 1}段`,
        start,
        end: end > endDate ? endDate : end
      });
    }
  } else if (timeRange === '1y') {
    // 分12个桶，每个月1个
    const year = endDate.getFullYear();
    for (let i = 0; i < 12; i++) {
      const start = new Date(year, i, 1);
      const end = new Date(year, i + 1, 0, 23, 59, 59);
      if (start <= endDate) {
        buckets.push({
          label: `${i + 1}月`,
          start,
          end: end > endDate ? endDate : end
        });
      }
    }
  } else if (timeRange === 'all') {
    // 分12个桶：从当前月份往前推12个月（含当前月），按时间升序
    const currentMonthStart = new Date(endDate.getFullYear(), endDate.getMonth(), 1, 0, 0, 0, 0);
    const firstMonthStart = new Date(currentMonthStart.getFullYear(), currentMonthStart.getMonth() - 11, 1, 0, 0, 0, 0);

    for (let i = 0; i < 12; i++) {
      const start = new Date(firstMonthStart.getFullYear(), firstMonthStart.getMonth() + i, 1, 0, 0, 0, 0);
      const end = new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59, 59, 999);

      buckets.push({
        label: `${start.getMonth() + 1}月`,
        start,
        end: end > endDate ? endDate : end
      });
    }
  }

  const trends: VolunteerTrendPoint[] = [];

  for (const bucket of buckets) {
    const startStr = formatDate(bucket.start);
    const endStr = formatDate(bucket.end);

    // 报名人次（去重）
    const [signupData]: any = await query(
      `SELECT COUNT(DISTINCT student_id) as count FROM activity_participants WHERE created_at BETWEEN ? AND ?`,
      [startStr, endStr]
    );

    // 实际出勤人次
    const [attendData]: any = await query(
      `SELECT COUNT(*) as count FROM activity_participants WHERE signed_in = 1 AND created_at BETWEEN ? AND ?`,
      [startStr, endStr]
    );

    // 累计服务时长
    const [hoursData]: any = await query(
      `SELECT SUM(service_hours) as total FROM activity_participants WHERE created_at BETWEEN ? AND ?`,
      [startStr, endStr]
    );

    trends.push({
      label: bucket.label,
      signup: signupData.count || 0,
      attend: attendData.count || 0,
      hours: Math.round((hoursData.total || 0) * 10) / 10
    });
  }

  return trends;
}

// ==================== 活动类型热度分布 ====================

/**
 * 获取活动类型分布
 */
async function getActivityDistribution(timeRange: string = '30d'): Promise<ActivitySlice[]> {
  const { startDate, endDate } = getTimeRange(timeRange);
  const startStr = formatDate(startDate);
  const endStr = formatDate(endDate);

  const rows: any = await query(
    `SELECT category, COUNT(*) as count FROM activities WHERE created_at BETWEEN ? AND ? AND category IS NOT NULL GROUP BY category ORDER BY count DESC`,
    [startStr, endStr]
  );

  return (rows || []).map((row: any) => ({
    name: row.category || '未分类',
    value: row.count
  }));
}

// ==================== 专业服务时长对比 ====================

/**
 * 获取专业服务时长统计
 */
async function getMajorStats(timeRange: string = '30d'): Promise<MajorStat[]> {
  const { startDate, endDate } = getTimeRange(timeRange);
  const startStr = formatDate(startDate);
  const endStr = formatDate(endDate);

  const rows: any = await query(
    `SELECT 
      ai.major,
      SUM(ap.service_hours) as hours,
      COUNT(DISTINCT ap.student_id) as volunteer_count
    FROM activity_participants ap
    LEFT JOIN auth_info ai ON ap.student_id = ai.student_id
    WHERE ap.created_at BETWEEN ? AND ? AND ai.major IS NOT NULL
    GROUP BY ai.major
    ORDER BY hours DESC`,
    [startStr, endStr]
  );

  return (rows || []).map((row: any) => ({
    name: row.major || '未分类',
    hours: Math.round((row.hours || 0) * 10) / 10,
    volunteerCount: row.volunteer_count || 0
  }));
}

// ==================== 高活跃志愿者排行 ====================

/**
 * 获取高活跃志愿者排行（Top 10）
 */
async function getTopVolunteers(timeRange: string = '30d'): Promise<TopVolunteer[]> {
  const { startDate, endDate } = getTimeRange(timeRange);
  const startStr = formatDate(startDate);
  const endStr = formatDate(endDate);

  const rows: any = await query(
    `SELECT 
      ap.student_id,
      ai.name,
      ai.college,
      ai.major,
      ai.skill_tags,
      SUM(ap.service_hours) as hours
    FROM activity_participants ap
    LEFT JOIN auth_info ai ON ap.student_id = ai.student_id
    WHERE ap.created_at BETWEEN ? AND ?
    GROUP BY ap.student_id
    ORDER BY hours DESC
    LIMIT 10`,
    [startStr, endStr]
  );

  return (rows || []).map((row: any) => ({
    studentId: row.student_id,
    name: row.name || '未知',
    department: row.major || row.college || '未分配',
    hours: Math.round((row.hours || 0) * 10) / 10,
    skills: row.skill_tags ? row.skill_tags.split(',').map((s: string) => s.trim()).slice(0, 3) : []
  }));
}

// ==================== 即将开展的活动 ====================

/**
 * 获取即将开展的活动
 * 查询条件：状态为"进行中"
 * 返回所有进行中的活动，按开始时间升序
 */
async function getUpcomingActivities(): Promise<UpcomingActivity[]> {
  const rows: any = await query(
    `SELECT 
      activity_id,
      activity_name,
      start_time,
      end_time,
      recruitment_limit,
      status
    FROM activities
    WHERE status = '进行中'
    ORDER BY start_time ASC`
  );

  return (rows || []).map((row: any) => ({
    activityId: row.activity_id,
    title: row.activity_name,
    startTime: row.start_time ? formatDate(new Date(row.start_time)) : '未定',
    endTime: row.end_time ? formatDate(new Date(row.end_time)) : '未定',
    participants: row.recruitment_limit || 0,
    status: 'ongoing' as const
  }));
}

// ==================== 主接口 ====================

/**
 * 获取完整的Dashboard数据
 */
export async function getDashboardData(timeRange: string = '30d'): Promise<DashboardData> {
  // 验证时间范围
  if (!['30d', '90d', '1y', 'all'].includes(timeRange)) {
    throw { status: HTTP_STATUS.BAD_REQUEST, message: 'timeRange 参数无效，仅支持 30d / 90d / 1y / all' };
  }

  try {
    const [kpiMetrics, volunteerTrend, activityDistribution, majorStats, topVolunteers, upcomingActivities] = await Promise.all([
      getKpiMetrics(timeRange),
      getVolunteerTrend(timeRange),
      getActivityDistribution(timeRange),
      getMajorStats(timeRange),
      getTopVolunteers(timeRange),
      getUpcomingActivities()
    ]);

    return {
      kpiMetrics,
      volunteerTrend,
      activityDistribution,
      majorStats,
      topVolunteers,
      upcomingActivities
    };
  } catch (error) {
    console.error('Dashboard数据聚合错误:', error);
    throw { status: HTTP_STATUS.INTERNAL_ERROR, message: '服务器内部错误' };
  }
}