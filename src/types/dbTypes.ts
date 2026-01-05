/**
 * 数据库表类型定义
 * 对应 MySQL 表结构
 */

// AuthLogin（用户登录凭证表）
export interface AuthLoginRecord {
  auth_id: number;
  role: 'user' | 'admin' | 'superadmin';
  student_id: string;
  email: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
}

export type AuthLoginWritable = Omit<
  AuthLoginRecord,
  'auth_id' | 'created_at' | 'updated_at'
>;

export const AuthLoginWritableFields: (keyof AuthLoginWritable)[] = [
  'role',
  'student_id',
  'email',
  'password_hash',
];


// AuthInfo（用户基础资料）
export interface AuthInfoRecord {
  info_id: number;
  student_id: string;
  name: string;
  gender: '男' | '女' | '其他' | null;
  college: string | null;
  major: string | null;
  phone: string | null;
  avatar_key: string | null;
  join_date: string | null;
  total_hours: number;
  skill_tags: string | null;
  created_at: string;
  updated_at: string;
}

export type AuthInfoWritable = Omit<
  AuthInfoRecord,
  'info_id' | 'created_at' | 'updated_at'
>;

export const AuthInfoWritableFields: (keyof AuthInfoWritable)[] = [
  'student_id',
  'name',
  'gender',
  'college',
  'major',
  'phone',
  'avatar_key',
  'join_date',
  'total_hours',
  'skill_tags',
];


// Department（部门信息）
export interface DepartmentRecord {
  dept_id: number;
  dept_name: string;
  description: string | null;
  leader_id: string | null;
  manager_id: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export type DepartmentWritable = Omit<
  DepartmentRecord,
  'dept_id' | 'created_at' | 'updated_at'
>;

export const DepartmentWritableFields: (keyof DepartmentWritable)[] = [
  'dept_name',
  'description',
  'leader_id',
  'manager_id',
  'display_order',
];


// TeamTerm（届次管理）
export interface TeamTermRecord {
  term_id: number;
  term_name: string;
  start_date: string | null;
  end_date: string | null;
  is_current: number;
  remark: string | null;
  created_at: string;
  updated_at: string;
}

export type TeamTermWritable = Omit<
  TeamTermRecord,
  'term_id' | 'created_at' | 'updated_at'
>;

export const TeamTermWritableFields: (keyof TeamTermWritable)[] = [
  'term_name',
  'start_date',
  'end_date',
  'is_current',
  'remark',
];


// BackboneMember（骨干成员）
export interface BackboneMemberRecord {
  member_id: number;
  student_id: string;
  dept_id: number;
  term_id: number;
  position: '队长' | '部长' | '副部长' | '部员';
  photo_key: string | null;
  term_start: string | null;
  term_end: string | null;
  remark: string | null;
  created_at: string;
  updated_at: string;
}

export type BackboneMemberWritable = Omit<
  BackboneMemberRecord,
  'member_id' | 'created_at' | 'updated_at'
>;

export const BackboneMemberWritableFields: (keyof BackboneMemberWritable)[] = [
  'student_id',
  'dept_id',
  'term_id',
  'position',
  'photo_key',
  'term_start',
  'term_end',
  'remark',
];


// Activity（活动记录）
export interface ActivityRecord {
  activity_id: number;
  activity_name: string;
  dept_id: number | null;
  term_id: number | null;
  category: string | null;
  cover_key: string | null;
  recruitment_limit: number;
  service_hours: number;
  location: string | null;
  start_time: string | null;
  end_time: string | null;
  description: string | null;
  status: '草稿' | '进行中' | '已结束';
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type ActivityWritable = Omit<
  ActivityRecord,
  'activity_id' | 'created_at' | 'updated_at'
>;

export const ActivityWritableFields: (keyof ActivityWritable)[] = [
  'activity_name',
  'dept_id',
  'term_id',
  'category',
  'cover_key',
  'recruitment_limit',
  'service_hours',
  'location',
  'start_time',
  'end_time',
  'description',
  'status',
  'created_by',
];


// ActivityParticipant（活动参与记录）
export interface ActivityParticipantRecord {
  record_id: number;
  activity_id: number;
  student_id: string;
  role: string | null;
  service_hours: number;
  signed_in: number;
  remark: string | null;
  created_at: string;
  updated_at: string;
}

export type ActivityParticipantWritable = Omit<
  ActivityParticipantRecord,
  'record_id' | 'created_at' | 'updated_at'
>;

export const ActivityParticipantWritableFields: (keyof ActivityParticipantWritable)[] = [
  'activity_id',
  'student_id',
  'role',
  'service_hours',
  'signed_in',
  'remark',
];


// Honor（荣誉表彰记录）
export interface HonorRecord {
  honor_id: number;
  student_id: string | null;
  term_id: number | null;
  honor_title: string;
  honor_level: string | null;
  issue_date: string | null;
  issuer: string | null;
  description: string | null;
  certificate_key: string | null;
  created_at: string;
  updated_at: string;
}

export type HonorWritable = Omit<
  HonorRecord,
  'honor_id' | 'created_at' | 'updated_at'
>;

export const HonorWritableFields: (keyof HonorWritable)[] = [
  'student_id',
  'term_id',
  'honor_title',
  'honor_level',
  'issue_date',
  'issuer',
  'description',
  'certificate_key',
];


// Announcement（公告）
export interface AnnouncementRecord {
  announcement_id: number;
  title: string;
  content: string;
  image_keys: string | null;
  author_id: string | null;
  term_id: number | null;
  publish_time: string | null;
  status: '草稿' | '已发布' | '归档';
  file_key: string | null;
  file_type: 'none' | 'pdf' | 'word';
  created_at: string;
  updated_at: string;
}

export type AnnouncementWritable = Omit<
  AnnouncementRecord,
  'announcement_id' | 'created_at' | 'updated_at'
>;

export const AnnouncementWritableFields: (keyof AnnouncementWritable)[] = [
  'title',
  'content',
  'image_keys',
  'author_id',
  'term_id',
  'publish_time',
  'status',
  'file_key',
  'file_type',
];


// GalleryPhoto（团队相册/风采展示）
export interface GalleryPhotoRecord {
  photo_id: number;
  term_id: number | null;
  activity_id: number | null;
  title: string | null;
  image_key: string;
  description: string | null;
  uploaded_by: string | null;
  uploaded_at: string;
  sort_order: number | null;
}

export type GalleryPhotoWritable = Omit<
  GalleryPhotoRecord,
  'photo_id' | 'uploaded_at'
>;

export const GalleryPhotoWritableFields: (keyof GalleryPhotoWritable)[] = [
  'term_id',
  'activity_id',
  'title',
  'image_key',
  'description',
  'uploaded_by',
  'sort_order',
];


// TeamMilestone（发展历程）
export interface TeamMilestoneRecord {
  milestone_id: number;
  term_id: number | null;
  title: string;
  description: string | null;
  event_date: string;
  event_type: string | null;
  image_key: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type TeamMilestoneWritable = Omit<
  TeamMilestoneRecord,
  'milestone_id' | 'created_at' | 'updated_at'
>;

export const TeamMilestoneWritableFields: (keyof TeamMilestoneWritable)[] = [
  'term_id',
  'title',
  'description',
  'event_date',
  'event_type',
  'image_key',
  'created_by',
];


// OperationLog（操作日志）
export interface OperationLogRecord {
  log_id: number;
  user_id: string;
  action: string;
  target_table: string | null;
  target_id: string | null;
  description: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export type OperationLogWritable = Omit<
  OperationLogRecord,
  'log_id' | 'created_at'
>;

export const OperationLogWritableFields: (keyof OperationLogWritable)[] = [
  'user_id',
  'action',
  'target_table',
  'target_id',
  'description',
  'ip_address',
  'user_agent',
];

// EmailVerificationCode（邮箱验证码）
export interface EmailVerificationCodeRecord {
  id: number;
  email: string;
  code: string;
  type: string | null;
  expires_at: string;
  verified: number | null;
  created_at: string;
}

export type EmailVerificationCodeWritable = Omit<
  EmailVerificationCodeRecord,
  'id' | 'created_at'
>;

export const EmailVerificationCodeWritableFields: (keyof EmailVerificationCodeWritable)[] = [
  'email',
  'code',
  'type',
  'expires_at',
  'verified',
];

// recruitment_seasons（纳新年度开关表）
export type RecruitmentType = 'new_student' | 'internal_election';
export type RecruitmentStatus =
  | 'pending_review'
  | 'interview1_passed'
  | 'interview1_failed'
  | 'interview2_passed'
  | 'interview2_failed'
  | 'pending_assignment'
  | 'assigned'
  | 'rejected';

export interface RecruitmentSeasonRecord {
  id: number;
  year: number;
  type: RecruitmentType;
  is_open: 0 | 1;
  title: string;
  start_time: string | null;
  end_time: string | null;
  created_at: string;
  updated_at: string;
}

export type RecruitmentSeasonWritable = Omit<
  RecruitmentSeasonRecord,
  'id' | 'created_at' | 'updated_at'
>;

export const RecruitmentSeasonWritableFields: (keyof RecruitmentSeasonWritable)[] = [
  'year',
  'type',
  'is_open',
  'title',
  'start_time',
  'end_time',
];

// TeamRecruitment（志愿服务队报名纳新 + 换届竞选表）
export interface TeamRecruitmentRecord {
  id: number;
  year: number;

  recruitment_type: RecruitmentType;
  interview_rounds: 1 | 2;  // 1=换届只一轮，2=新生走两轮

  student_id: string;
  name: string;
  gender: '男' | '女' | '其他';
  college: string;
  major: string;
  grade: string;
  phone: string;
  email: string;
  qq: string | null;
  dormitory: string | null;

  intention_dept1: string;
  intention_dept2: string | null;

  current_position: string | null;   // 换届专用
  election_position: string | null;  // 换届专用
  work_plan: string | null;          // 换届专用

  self_intro: string | null;
  past_experience: string | null;
  reason_for_joining: string | null;
  skill_tags: string | null;

  status: RecruitmentStatus;

  final_department: string | null;
  final_position: string | null;

  reviewed_by_stage1: number | null;
  review_remark_stage1: string | null;
  reviewed_by_stage2: number | null;
  review_remark_stage2: string | null;
  assigned_by: number | null;

  created_at: string;
  updated_at: string;
}

export type TeamRecruitmentWritable = Omit<
  TeamRecruitmentRecord,
  'id' | 'created_at' | 'updated_at'
>;

export const TeamRecruitmentWritableFields: (keyof TeamRecruitmentWritable)[] = [
  'year',
  'recruitment_type',
  'interview_rounds',
  'student_id',
  'name',
  'gender',
  'college',
  'major',
  'grade',
  'phone',
  'email',
  'qq',
  'dormitory',
  'intention_dept1',
  'intention_dept2',
  'current_position',
  'election_position',
  'work_plan',
  'self_intro',
  'past_experience',
  'reason_for_joining',
  'skill_tags',
  'status',
  'final_department',
  'final_position',
  'reviewed_by_stage1',
  'review_remark_stage1',
  'reviewed_by_stage2',
  'review_remark_stage2',
  'assigned_by',
];