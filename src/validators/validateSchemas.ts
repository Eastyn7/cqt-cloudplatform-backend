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
  avatar_url: {
    type: "string",
    message: "头像 URL 必须为字符串"
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
    message: "负责人ID格式错误"
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
  photo_url: {
    type: "string",
    message: "照片 URL 必须为字符串"
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
  cover_url: {
    type: "string",
    message: "封面 URL 必须为字符串"
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
  certificate_url: {
    type: "string",
    message: "证书图片 URL 必须为字符串"
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
    required: true,
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
  file_url: {
    type: "string",
    message: "文件 URL 必须为字符串"
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
  image_url: {
    required: true,
    type: "string",
    message: "图片 URL 不能为空"
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
  image_url: {
    type: "string",
    message: "图片 URL 必须为字符串"
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