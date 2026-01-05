import {
  isStudentId,
  isCtbuEmail,
  isEmail,
  isPhone,
  isStrongPassword
} from "../utils/validator";

export type FieldRule = {
  required?: boolean;
  type?: "string" | "number" | "enum" | "date";
  enumValues?: string[];
  validator?: (value: unknown) => boolean;
  message: string;
};

// ---------------------------
// AuthLogin 校验
// ---------------------------
export const AuthLoginSchema: Record<string, FieldRule> = {
  student_id: {
    required: true,
    validator: (v: unknown) => typeof v === "string" && isStudentId(v),
    message: "学号必须为10位数字",
  },
  email: {
    required: true,
    validator: (v: unknown) =>
      typeof v === "string" && (isCtbuEmail(v) || isEmail(v)),
    message: "邮箱格式错误（必须为有效邮箱）",
  },
  password_hash: {
    required: true,
    validator: (v: unknown) => typeof v === "string" && v.length > 0,
    message: "密码不能为空",
  },
  role: {
    required: true,
    type: "enum",
    enumValues: ["user", "admin", "superadmin"],
    message: "角色必须为 user、admin 或 superadmin",
  },
};

// ---------------------------
// 注册校验
// ---------------------------
export const RegistrationSchema: Record<string, FieldRule> = {
  student_id: {
    required: true,
    validator: (v: unknown) => typeof v === "string" && isStudentId(v),
    message: "学号格式错误（必须为10位数字）",
  },
  email: {
    required: true,
    validator: (v: unknown) => typeof v === "string" && isCtbuEmail(v),
    message: "邮箱格式错误（必须为 @ctbu.edu.cn）",
  },
  password: {
    required: true,
    validator: (v: unknown) => typeof v === "string" && isStrongPassword(v),
    message: "密码强度不符合要求",
  },
  name: {
    required: true,
    validator: (v: unknown) => typeof v === "string" && v.length > 0,
    message: "姓名不能为空",
  },
  code: {
    required: true,
    validator: (v) => typeof v === "string" && v.length > 0,
    message: "验证码不能为空",
  }
};

// ---------------------------
// 登录校验
// ---------------------------
export const LoginSchema: Record<string, FieldRule> = {
  loginInput: {
    required: true,
    validator: (v: unknown) =>
      typeof v === "string" &&
      (isStudentId(v) || isCtbuEmail(v) || isEmail(v)),
    message: "学号或邮箱格式错误",
  },
  password: {
    required: true,
    validator: (v: unknown) => typeof v === "string" && v.length > 0,
    message: "密码不能为空",
  },
};

// ---------------------------
// 批量注册校验
// ---------------------------
export const BatchRegistrationSchema: Record<string, FieldRule> = {
  student_id: {
    required: true,
    validator: (v: unknown) => typeof v === "string" && isStudentId(v),
    message: "学号格式错误（必须为10位数字）",
  },
  email: {
    required: true,
    validator: (v: unknown) => typeof v === "string" && isCtbuEmail(v),
    message: "邮箱格式错误（必须为 @ctbu.edu.cn）",
  },
  password: {
    required: true,
    validator: (v: unknown) => typeof v === "string" && isStrongPassword(v),
    message: "密码强度不符合要求",
  },
  name: {
    required: true,
    validator: (v: unknown) => typeof v === "string" && v.length > 0,
    message: "姓名不能为空",
  }
};

// ---------------------------
// 批量删除用户校验
// ---------------------------
export const BatchDeleteAuthSchema: Record<string, FieldRule> = {
  student_id: {
    required: true,
    validator: (v: unknown) => typeof v === "string" && isStudentId(v),
    message: "学号格式错误",
  }
};

// ---------------------------
// 修改密码校验
// ---------------------------
export const ChangePasswordSchema: Record<string, FieldRule> = {
  email: {
    required: true,
    validator: (v: unknown) => typeof v === "string" && isCtbuEmail(v),
    message: "邮箱格式不正确",
  },
  oldPassword: {
    required: true,
    validator: (v) => typeof v === "string" && v.length > 0,
    message: "旧密码不能为空",
  },
  newPassword: {
    required: true,
    validator: (v: unknown) => typeof v === "string" && isStrongPassword(v),
    message: "新密码强度不符合要求",
  },
  code: {
    required: true,
    validator: (v) => typeof v === "string" && v.length > 0,
    message: "验证码不能为空",
  }
};

// ---------------------------
// 设置管理员校验
// ---------------------------
export const SetAdminSchema: Record<string, FieldRule> = {
  student_id: {
    required: true,
    validator: (v: unknown) => typeof v === "string" && isStudentId(v),
    message: "学号格式错误",
  },
};

// ---------------------------
// 批量设置用户角色校验
// ---------------------------
export const BatchSetUserRolesSchema: Record<string, FieldRule> = {
  userRoles: {
    required: true,
    validator: (v: unknown) => {
      if (!Array.isArray(v) || v.length === 0) return false;
      return v.every((item: any) => {
        return (
          typeof item === 'object' &&
          item !== null &&
          typeof item.student_id === 'string' &&
          isStudentId(item.student_id) &&
          ['user', 'admin', 'superadmin'].includes(item.role)
        );
      });
    },
    message: "userRoles 必须为非空数组，每个元素包含有效的 student_id 和 role",
  },
};

// ---------------------------
// AuthInfo 校验
// ---------------------------
export const AuthInfoSchema: Record<string, FieldRule> = {
  student_id: {
    required: true,
    validator: (v: unknown) => typeof v === "string" && isStudentId(v),
    message: "学号格式错误",
  },
  name: {
    required: true,
    validator: (v: unknown) => typeof v === "string" && v.length > 0,
    message: "姓名不能为空",
  },
  gender: {
    type: "enum",
    enumValues: ["男", "女", "其他"],
    message: "性别不合法",
  },
  college: {
    type: "string",
    message: "学院必须为字符串",
  },
  major: {
    type: "string",
    message: "专业必须为字符串",
  },
  phone: {
    validator: (v: unknown) => typeof v === "string" ? isPhone(v) : true,
    message: "手机号格式不正确",
  },
  avatar_key: {
    type: "string",
    message: "头像 key 必须为字符串"
  },
  join_date: {
    type: "date",
    message: "入队日期格式错误"
  },
  total_hours: {
    type: "number",
    message: "总服务时长必须为数字"
  },
  skill_tags: {
    type: "string",
    message: "技能标签必须为字符串"
  },
};

// ---------------------------
// Department 校验
// ---------------------------
export const DepartmentSchema: Record<string, FieldRule> = {
  dept_name: {
    required: true,
    message: "部门名称不能为空"
  },
  description: {
    type: "string",
    message: "描述必须为字符串"
  },
  leader_id: {
    validator: (v: unknown) => typeof v === "string" && isStudentId(v),
    message: "部门负责人学号格式错误"
  },
  manager_id: {
    validator: (v: unknown) => typeof v === "string" && isStudentId(v),
    message: "上级负责人学号格式错误"
  },
  display_order: {
    type: "number",
    message: "排序必须为数字"
  },
};

// ---------------------------
// TeamTerm 校验
// ---------------------------
export const TeamTermSchema: Record<string, FieldRule> = {
  term_name: {
    required: true,
    message: "届次名称不能为空"
  },
  start_date: {
    type: "date",
    message: "开始日期格式错误"
  },
  end_date: {
    type: "date",
    message: "结束日期格式错误"
  },
  is_current: {
    type: "number",
    message: "是否当前届次必须为数字"
  },
  remark: {
    type: "string",
    message: "备注必须为字符串"
  },
};

// ---------------------------
// BackboneMember 校验
// ---------------------------
export const BackboneMemberSchema: Record<string, FieldRule> = {
  student_id: {
    required: true,
    validator: (v: unknown) => typeof v === "string" && isStudentId(v),
    message: "学号错误"
  },
  dept_id: {
    required: true,
    type: "number",
    message: "部门 ID 必须为数字"
  },
  term_id: {
    required: true,
    type: "number",
    message: "届次 ID 必须为数字"
  },
  position: {
    type: "enum",
    enumValues: ["队长", "部长", "副部长", "部员"],
    message: "职位不合法"
  },
  photo_key: {
    type: "string",
    message: "照片 key 必须为字符串"
  },
  term_start: {
    type: "date",
    message: "任期开始日期格式错误"
  },
  term_end: {
    type: "date",
    message: "任期结束日期格式错误"
  },
  remark: {
    type: "string",
    message: "备注必须为字符串"
  },
};

// ---------------------------
// Activity 校验
// ---------------------------
export const ActivitySchema: Record<string, FieldRule> = {
  activity_name: {
    required: true,
    type: "string",
    message: "活动名称不能为空"
  },
  dept_id: {
    type: "number",
    message: "部门 ID 必须为数字"
  },
  term_id: {
    type: "number",
    message: "届次 ID 必须为数字"
  },
  category: {
    type: "string",
    message: "类别必须为字符串"
  },
  cover_key: {
    type: "string",
    message: "封面 key 必须为字符串"
  },
  recruitment_limit: {
    type: "number",
    message: "招募人数必须为数字"
  },
  service_hours: {
    type: "number",
    message: "服务时长必须为数字"
  },
  location: {
    type: "string",
    message: "地点必须为字符串"
  },
  start_time: {
    type: "date",
    message: "开始时间格式错误"
  },
  end_time: {
    type: "date",
    message: "结束时间格式错误"
  },
  description: {
    type: "string",
    message: "描述必须为字符串"
  },
  status: {
    type: "enum",
    enumValues: ["草稿", "进行中", "已结束"],
    message: "状态不合法"
  },
  created_by: {
    type: "string",
    message: "创建人必须为字符串"
  },
};

// ---------------------------
// ActivityParticipant 校验
// ---------------------------
export const ActivityParticipantSchema: Record<string, FieldRule> = {
  activity_id: {
    required: true,
    type: "number",
    message: "活动 ID 必须为数字"
  },
  student_id: {
    required: true,
    validator: (v: unknown) => typeof v === "string" && isStudentId(v),
    message: "学号错误"
  },
  role: {
    type: "string",
    message: "角色必须为字符串"
  },
  service_hours: {
    type: "number",
    message: "服务时长必须为数字"
  },
  signed_in: {
    type: "number",
    message: "签到状态必须为数字"
  },
  remark: {
    type: "string",
    message: "备注必须为字符串"
  },
};

// ---------------------------
// Honor 校验
// ---------------------------
export const HonorSchema: Record<string, FieldRule> = {
  student_id: {
    validator: (v: unknown) => typeof v === "string" && isStudentId(v),
    message: "学号错误"
  },
  term_id: {
    type: "number",
    message: "届次 ID 必须为数字"
  },
  honor_title: {
    required: true,
    type: "string", message: "荣誉名称不能为空"
  },
  honor_level: {
    type: "string",
    message: "荣誉等级必须为字符串"
  },
  issue_date: {
    type: "date",
    message: "颁发日期格式错误"
  },
  issuer: {
    type: "string",
    message: "颁发单位必须为字符串"
  },
  description: {
    type: "string",
    message: "描述必须为字符串"
  },
  certificate_key: {
    type: "string",
    message: "证书图片 key 必须为字符串"
  },
};

// ---------------------------
// Announcement 校验
// ---------------------------
export const AnnouncementSchema: Record<string, FieldRule> = {
  title: {
    required: true,
    type: "string",
    message: "标题不能为空"
  },
  content: {
    type: "string",
    message: "内容不能为空"
  },
  author_id: {
    type: "string",
    message: "作者 ID 必须为字符串"
  },
  term_id: {
    type: "number",
    message: "届次 ID 必须为数字"
  },
  publish_time: {
    type: "date",
    message: "发布时间格式错误"
  },
  status: {
    type: "enum",
    enumValues: ["草稿", "已发布", "归档"],
    message: "状态不合法"
  },
  file_key: {
    type: "string",
    message: "文件 key 必须为字符串"
  },
  file_type: {
    type: "enum",
    enumValues: ["none", "pdf", "word"],
    message: "文件类型不合法"
  },
};

// ---------------------------
// GalleryPhoto 校验
// ---------------------------
export const GalleryPhotoSchema: Record<string, FieldRule> = {
  term_id: {
    type: "number",
    message: "届次 ID 必须为数字"
  },
  activity_id: {
    type: "number",
    message: "活动 ID 必须为数字"
  },
  title: {
    type: "string",
    message: "标题必须为字符串"
  },
  image_key: {
    required: true,
    type: "string",
    message: "图片 key 不能为空"
  },
  description: {
    type: "string",
    message: "描述必须为字符串"
  },
  uploaded_by: {
    type: "string",
    message: "上传人必须为字符串"
  },
  sort_order: {
    type: "number",
    message: "排序必须为数字"
  },
};

// ---------------------------
// TeamMilestone 校验
// ---------------------------
export const TeamMilestoneSchema: Record<string, FieldRule> = {
  term_id: {
    type: "number",
    message: "届次 ID 必须为数字"
  },
  title: {
    required: true,
    type: "string",
    message: "标题不能为空"
  },
  description: {
    type: "string",
    message: "描述必须为字符串"
  },
  event_date: {
    required: true,
    type: "date",
    message: "事件日期格式错误"
  },
  event_type: {
    type: "string",
    message: "事件类型必须为字符串"
  },
  image_key: {
    type: "string",
    message: "图片 key 必须为字符串"
  },
  created_by: {
    type: "string",
    message: "创建人必须为字符串"
  },
};

// ---------------------------
// OperationLog 校验
// ---------------------------
export const OperationLogSchema: Record<string, FieldRule> = {
  user_id: {
    required: true,
    type: "string",
    message: "用户 ID 不能为空"
  },
  action: {
    required: true,
    type: "string",
    message: "操作动作不能为空"
  },
  target_table: {
    type: "string",
    message: "目标表必须为字符串"
  },
  target_id: {
    type: "string",
    message: "目标 ID 必须为字符串"
  },
  description: {
    type: "string",
    message: "描述必须为字符串"
  },
  ip_address: {
    type: "string",
    message: "IP 地址必须为字符串"
  },
  user_agent: {
    type: "string",
    message: "User-Agent 必须为字符串"
  },
};

// ---------------------------
// EmailVerificationCode 校验
// ---------------------------
export const EmailVerificationCodeSchema: Record<string, FieldRule> = {
  email: {
    required: true,
    validator: (v: unknown) => typeof v === "string" && isEmail(v),
    message: "邮箱格式错误"
  },
  code: {
    required: true,
    validator: (v: unknown) => typeof v === "string" && v.length > 0,
    message: "验证码不能为空"
  },
  type: {
    type: "string",
    message: "type 必须为字符串或 null"
  },
  expires_at: {
    required: true,
    type: "date",
    message: "expires_at 必须为有效日期"
  },
  verified: {
    type: "number",
    validator: (v: unknown) => v === 0 || v === 1,
    message: "verified 必须为 0 或 1"
  }
};

// ---------------------------
// 发送验证码校验
// ---------------------------
export const SendEmailCodeSchema: Record<string, FieldRule> = {
  email: {
    required: true,
    validator: (v: unknown) => typeof v === "string" && isCtbuEmail(v),
    message: "邮箱格式错误"
  },
  type: {
    type: "string",
    message: "type 必须为字符串或 null"
  }
};

// ---------------------------
// 验证验证码校验
// ---------------------------
export const VerifyEmailCodeSchema: Record<string, FieldRule> = {
  email: {
    required: true,
    validator: (v: unknown) => typeof v === "string" && isCtbuEmail(v),
    message: "邮箱格式错误"
  },
  code: {
    required: true,
    validator: (v: unknown) => typeof v === "string" && v.length > 0,
    message: "验证码不能为空"
  },
  type: {
    type: "string",
    message: "type 必须为字符串或 null"
  }
};

// ---------------------------
// 开启/关闭报名通道校验
// ---------------------------
export const SeasonControlSchema: Record<string, FieldRule> = {
  year: {
    required: true,
    validator: (v: unknown) => typeof v === "number" && v >= 2025,
    message: "年份必须为有效数字（如2025）",
  },
  type: {
    required: true,
    type: "enum",
    enumValues: ["new_student", "internal_election"],
    message: "type 必须为 new_student 或 internal_election",
  },
  title: {
    required: true,
    validator: (v: unknown) => typeof v === "string" && v.length >= 4 && v.length <= 100,
    message: "标题长度4-100字符",
  },
  start_time: {
    required: false,
    validator: (v: unknown) => !v || typeof v === "string",
    message: "开始时间格式错误",
  },
  end_time: {
    required: false,
    validator: (v: unknown) => !v || typeof v === "string",
    message: "结束时间格式错误",
  },
};

// ---------------------------
// 用户提交报名校验（新生纳新 + 换届竞选通用）
// ---------------------------
export const RecruitmentApplySchema: Record<string, FieldRule> = {
  type: {
    required: true,
    type: "enum",
    enumValues: ["new_student", "internal_election"],
    message: "type 必须为 new_student 或 internal_election",
  },
  intention_dept1: {
    required: true,
    validator: (v: unknown) => typeof v === "string" && v.trim().length > 0,
    message: "第一志愿/竞选部门不能为空且必须为字符串",
  },
  intention_dept2: {
    validator: (v: unknown) => v === null || v === undefined || (typeof v === "string" && v.trim().length >= 0),
    message: "第二志愿必须为字符串（可为空）",
  },
  self_intro: {
    required: true,
    validator: (v: unknown) => v === null || v === undefined || typeof v === "string",
    message: "自我介绍不能为空且必须为字符串",
  },
  past_experience: {
    validator: (v: unknown) => v === null || v === undefined || typeof v === "string",
    message: "过往经历必须为字符串",
  },
  reason_for_joining: {
    required: true,
    validator: (v: unknown) =>
      typeof v === "string" && v.trim().length >= 50 && v.trim().length <= 2000,
    message: "加入动机/竞选理由必须为字符串且50-2000字",
  },
  skill_tags: {
    required: false,
    validator: (v: unknown) =>
      !v ||
      (Array.isArray(v) &&
        v.every((tag) => typeof tag === "string" && tag.trim().length > 0)),
    message: "skill_tags 必须为字符串数组且每一项不能为空",
  },

  // 换届竞选专属字段（后端再加一层保险，前端已控制必填）
  current_position: {
    validator: (v: unknown) =>
      v === null || v === undefined || (typeof v === "string" && v.trim().length > 0),
    message: "当前职务必须为字符串",
  },
  election_position: {
    validator: (v: unknown) =>
      v === null || v === undefined || (typeof v === "string" && v.trim().length > 0),
    message: "竞选目标职务必须为字符串",
  },
  work_plan: {
    required: false,
    validator: (v: unknown) =>
      v === null || v === undefined || (typeof v === "string" && v.trim().length >= 100),
    message: "工作计划必须为字符串且不少于100字",
  },
};

// ---------------------------
// 管理员审核/操作通用校验
// ---------------------------
const AdminOperationSchema: Record<string, FieldRule> = {
  year: {
    required: true,
    validator: (v: unknown) => /^\d{4}$/.test(String(v)),
    message: "年份格式错误",
  },
  student_ids: {
    required: true,
    validator: (v: unknown) => Array.isArray(v) && v.length > 0 && v.every(id => typeof id === "string"),
    message: "student_ids 必须为非空字符串数组",
  },
};

export const ReviewStageSchema: Record<string, FieldRule> = {
  ...AdminOperationSchema,
  stage: {
    required: true,
    type: "enum",
    enumValues: ["1", "2"],
    message: "stage 必须为 1 或 2",
  },
  pass: {
    required: true,
    validator: (v: unknown) => typeof v === "boolean",
    message: "pass 必须为 true 或 false",
  },
  remark: {
    type: "string",
    message: "type 必须为字符串或 null"
  },
};

export const AssignDeptSchema: Record<string, FieldRule> = {
  ...AdminOperationSchema,
  department: {
    required: true,
    message: "必须选择最终部门"
  },
  position: {
    type: "string",
    message: "type 必须为字符串或 null"
  },
};