# API 接口文档

所有路由统一前缀为 /api。

## 响应格式规范
- **成功响应**：{ code: 200, success: true, message: string, data: any }
- **失败响应**：{ code: number, success: false, message: string, debug?: any }
- **分页响应**：{ code: 200, success: true, message: string, data: { list: any[], pagination: { page: number, pageSize: number, total: number } } }
- **列表响应**：{ code: 200, success: true, message: string, data: { list: any[], total: number } }

---

## publicRouter (\/api/public\)

公开接口，无需身份验证。

### 邮箱验证码

#### **POST** \/email/send\  发送验证码

**请求体**：
\\\json
{
  "email": "string (必填，CTBU邮箱格式 xxx@ctbu.edu.cn)",
  "type": "string? (可选，验证类型标识)"
}
\\\

**返回**：\{ code: 200, success: true, message: "验证码已发送到邮箱", data: null }\

#### **POST** \/email/verify\  校验验证码

**请求体**：
\\\json
{
  "email": "string (必填，CTBU邮箱)",
  "code": "string (必填，6位验证码)",
  "type": "string? (可选)"
}
\\\

**返回**：\{ code: 200, success: true, message: "验证成功", data: null }\

### 认证相关

#### **POST** \/auth/register\  用户注册

**请求体**：
\\\json
{
  "student_id": "string (必填，10位学号)",
  "email": "string (必填，CTBU邮箱 xxx@ctbu.edu.cn)",
  "password": "string (必填，强密码：8位，需包含大小写字母、数字、特殊字符)",
  "name": "string (必填，真实姓名)",
  "code": "string (必填，邮箱验证码)"
}
\\\

**返回**：
\\\json
{
  "code": 201,
  "success": true,
  "message": "注册成功",
  "data": {
    "student_id": "string",
    "name": "string",
    "token": "string (JWT令牌)"
  }
}
\\\

#### **POST** \/auth/login\  用户登录

**请求体**：
\\\json
{
  "loginInput": "string (必填，学号或邮箱均可)",
  "password": "string (必填)"
}
\\\

**返回**：
\\\json
{
  "code": 200,
  "success": true,
  "message": "登录成功",
  "data": {
    "token": "string (JWT令牌)",
    "student_id": "string",
    "name": "string",
    "role": "user | admin | superadmin"
  }
}
\\\

#### **POST** \/auth/change-password\  修改密码

**请求体**：
\\\json
{
  "email": "string (必填，CTBU邮箱)",
  "oldPassword": "string (必填，当前密码)",
  "newPassword": "string (必填，新密码，需符合强密码要求)",
  "code": "string (必填，邮箱验证码)"
}
\\\

**返回**：\{ code: 200, success: true, message: "密码修改成功", data: null }\

### 部门管理（公开读取）

#### **GET** \/departments/list\  获取所有部门（全量）

**查询参数**：无

**数据结构**：
\\\json
{
  "dept_id": "number",
  "dept_name": "string",
  "description": "string?",
  "leader_id": "string? (负责人学号)",
  "leader_name": "string? (负责人姓名，LEFT JOIN获得)",
  "manager_id": "string? (上级负责人学号)",
  "manager_name": "string? (上级负责人姓名)",
  "display_order": "number (排序值)",
  "created_at": "string",
  "updated_at": "string"
}
\\\

**返回**：\{ code: 200, success: true, message: "获取成功", data: { list: [...], total: number } }\

#### **GET** \/departments/page\  部门分页查询

**查询参数**：
- \page?: number\ (默认1)
- \pageSize?: number\ (默认20)
- \search?: string\ (模糊搜索：部门名称、负责人学号、负责人姓名)

**返回**：\{ code: 200, success: true, message: "获取成功", data: { list: [...], pagination: { page, pageSize, total } } }\

#### **GET** \/departments/:dept_id\  获取部门详情

**路径参数**：\dept_id (number)\

**返回**：\{ code: 200, success: true, message: "获取成功", data: { /* 部门对象 */ } }\

### 届次管理（公开读取）

#### **GET** \/team-terms/page\  届次分页查询

**查询参数**：
- \page?: number\
- \pageSize?: number\
- \search?: string\ (模糊搜索：届次名称)

**数据结构**：
\\\json
{
  "term_id": "number",
  "term_name": "string",
  "start_date": "string? (YYYY-MM-DD)",
  "end_date": "string?",
  "is_current": "number (0=否, 1=是)",
  "remark": "string?",
  "created_at": "string",
  "updated_at": "string"
}
\\\

#### **GET** \/team-terms/list\  届次全量列表

**返回**：\{ code: 200, success: true, message: "获取成功", data: { list, total } }\

#### **GET** \/team-terms/:term_id\  获取届次详情

### 骨干成员（公开读取）

#### **GET** \/backbone-members/page\  骨干成员分页

**查询参数**：
- \page?: number\
- \pageSize?: number\
- \search?: string\ (模糊搜索：学号、姓名)

**数据结构**：
\\\json
{
  "member_id": "number",
  "student_id": "string",
  "name": "string",
  "dept_id": "number",
  "dept_name": "string? (LEFT JOIN)",
  "term_id": "number",
  "term_name": "string?",
  "position": "队长 | 部长 | 副部长 | 部员",
  "photo_key": "string? (OSS key)",
  "term_start": "string? (YYYY-MM-DD)",
  "term_end": "string?",
  "remark": "string?",
  "created_at": "string",
  "updated_at": "string"
}
\\\

#### **GET** \/backbone-members/all\  骨干成员全量

#### **GET** \/backbone-members/tree\  骨干成员树形结构

### 活动管理（公开读取，不含草稿）

#### **GET** \/activities/page\  活动分页（仅非"草稿"）

**查询参数**：
- \page?: number\
- \pageSize?: number\
- \search?: string\ (模糊搜索：活动名称、地点、描述)
- \status?: string\ (精确筛选：进行中、已结束)
- \category?: string\ (精确筛选：活动类别)

**数据结构**：
\\\json
{
  "activity_id": "number",
  "activity_name": "string",
  "dept_id": "number?",
  "dept_name": "string?",
  "term_id": "number?",
  "term_name": "string?",
  "category": "string?",
  "cover_key": "string? (OSS key)",
  "recruitment_limit": "number",
  "service_hours": "number",
  "location": "string?",
  "start_time": "string? (ISO格式)",
  "end_time": "string?",
  "description": "string?",
  "status": "进行中 | 已结束",
  "created_by": "string? (学号)",
  "created_at": "string",
  "updated_at": "string"
}
\\\

#### **GET** \/activities/list\  活动全量（不含草稿）

#### **GET** \/activities/:activity_id\  获取活动详情

### 荣誉记录（公开读取）

#### **GET** \/honor-records/page\  荣誉记录分页

**查询参数**：
- \page?: number\
- \pageSize?: number\
- \search?: string\ (模糊搜索：学号、姓名、荣誉名称)
- \honor_level?: string\ (精确筛选：荣誉等级)
- \	erm_id?: number\ (精确筛选：届次ID)

**数据结构**：
\\\json
{
  "honor_id": "number",
  "student_id": "string?",
  "name": "string? (LEFT JOIN)",
  "term_id": "number?",
  "term_name": "string?",
  "honor_title": "string",
  "honor_level": "string?",
  "issue_date": "string? (YYYY-MM-DD)",
  "issuer": "string?",
  "description": "string?",
  "certificate_key": "string? (OSS key)",
  "created_at": "string",
  "updated_at": "string"
}
\\\

#### **GET** \/honor-records/list\  荣誉记录全量

#### **GET** \/honor-records/wall/list\  荣誉墙全量

#### **GET** \/honor-records/wall/page\  荣誉墙分页

**查询参数**：\page?, pageSize?\

### 公告管理（公开读取已发布）

#### **GET** \/announcements/published\  获取已发布公告

**数据结构**：
\\\json
{
  "announcement_id": "number",
  "title": "string",
  "content": "string (HTML)",
  "image_keys": "string? (逗号分隔OSS key)",
  "author_id": "string?",
  "author_name": "string? (LEFT JOIN)",
  "term_id": "number?",
  "term_name": "string?",
  "publish_time": "string?",
  "status": "已发布",
  "file_key": "string? (OSS key)",
  "file_type": "none | pdf | word",
  "created_at": "string",
  "updated_at": "string"
}
\\\

### 相册照片（公开读取）

#### **GET** \/gallery-photos/term/:term_id\  按届次获取照片

**数据结构**：
\\\json
{
  "photo_id": "number",
  "term_id": "number?",
  "activity_id": "number?",
  "title": "string?",
  "image_key": "string (OSS key)",
  "description": "string?",
  "uploaded_by": "string? (学号)",
  "uploaded_at": "string",
  "sort_order": "number?"
}
\\\

#### **GET** \/gallery-photos/activity/:activity_id\  按活动获取照片

### 发展历程（公开读取）

#### **GET** \/team-milestones/term/page/:term_id\  按届次历程分页

**查询参数**：\page?, pageSize?\

**数据结构**：
\\\json
{
  "milestone_id": "number",
  "term_id": "number?",
  "term_name": "string?",
  "title": "string",
  "description": "string?",
  "event_date": "string (YYYY-MM-DD)",
  "event_type": "string?",
  "image_key": "string? (OSS key)",
  "created_by": "string? (学号)",
  "created_at": "string",
  "updated_at": "string"
}
\\\

#### **GET** \/team-milestones/term/list/:term_id\  按届次历程全量

#### **GET** \/team-milestones/type/page/:event_type\  按类型历程分页

#### **GET** \/team-milestones/type/list/:event_type\  按类型历程全量

#### **GET** \/team-milestones/date-range/page\  按时间范围历程分页

**查询参数**：
- \start_date?: string (YYYY-MM-DD)\
- \end_date?: string\
- \page?, pageSize?\

#### **GET** \/team-milestones/date-range/list\  按时间范围历程全量

---

## 后台接口（需权限）

### emailRouter (\/api/email\)  验证码管理

需要 \dmin\ 或 \superadmin\ 权限。

#### **DELETE** \/cleanup\  清理过期验证码

#### **GET** \/list\  验证码列表分页

**查询参数**：\page?, pageSize?, email?\

### authLoginRouter (\/api/auth/login\)  用户管理

#### **POST** \/batch-register\  批量注册用户

**权限**：\dmin\ 或 \superadmin\

**请求体**：
\\\json
{
  "users": [
    {
      "student_id": "string (必填，10位学号)",
      "email": "string (必填，CTBU邮箱)",
      "password": "string (必填，强密码)",
      "name": "string (必填)"
    }
  ]
}
\\\

#### **DELETE** \/delete/:student_id\  删除单个用户

**权限**：\superadmin\

#### **POST** \/delete/batch\  批量删除用户

**权限**：\superadmin\

**请求体**：\{ "student_ids": ["string", ...] }\

#### **GET** \/admin/list-page\  管理员分页

**权限**：\dmin\ 或 \superadmin\

**查询参数**：\page?, pageSize?, search?\ (模糊搜索：学号、姓名、邮箱)

#### **GET** \/admin/list\  管理员全量列表

**权限**：\dmin\ 或 \superadmin\

#### **POST** \/admin/set-single\  设置单个管理员

**权限**：\superadmin\

**请求体**：\{ "student_id": "string", "role": "admin | superadmin" }\

#### **POST** \/admin/set\  批量设置用户角色

**权限**：\superadmin\

**请求体**：
\\\json
{
  "userRoles": [
    { "student_id": "string", "role": "user | admin | superadmin" }
  ]
}
\\\

#### **POST** \/admin/remove\  取消管理员权限

**权限**：\superadmin\

**请求体**：\{ "student_id": "string" }\

#### **GET** \/users/search\  搜索用户

**权限**：\dmin\ 或 \superadmin\

**查询参数**：\keyword?: string\ (学号、姓名、邮箱)

### authInfoRouter (\/api/auth/info\)  用户信息

#### **PUT** \/update/:student_id\  更新用户信息

**请求体**：
\\\json
{
  "name": "string?",
  "gender": "男 | 女 | 其他?",
  "college": "string?",
  "major": "string?",
  "phone": "string?",
  "avatar_key": "string? (OSS key)",
  "join_date": "string? (YYYY-MM-DD)",
  "total_hours": "number?",
  "skill_tags": "string? (逗号分隔)"
}
\\\

#### **GET** \/info/:student_id\  查询单个用户信息

#### **GET** \/page\  用户信息分页

**权限**：\dmin\ 或 \superadmin\

**查询参数**：
- \page?, pageSize?\
- \search?: string\ (模糊搜索：学号、姓名、邮箱)
- \
ole?: string\ (精确筛选)
- \college?: string\ (精确筛选)
- \major?: string\ (精确筛选)

#### **GET** \/all\  用户信息全量

**权限**：\dmin\ 或 \superadmin\

#### **POST** \/batch-import\  批量导入/更新用户

**权限**：\dmin\ 或 \superadmin\

#### **GET** \/colleges-majors\  获取学院专业列表

**权限**：\dmin\ 或 \superadmin\

#### **GET** \/admins\  获取管理员列表

**权限**：\dmin\ 或 \superadmin\

### departmentsRouter (\/api/departments\)  部门管理

#### **POST** \/create\  创建部门

**权限**：\superadmin\

**请求体**：
\\\json
{
  "dept_name": "string (必填)",
  "description": "string?",
  "leader_id": "string? (10位学号)",
  "manager_id": "string?",
  "display_order": "number? (默认0)"
}
\\\

#### **PUT** \/update/:dept_id\  更新部门

**权限**：\dmin\ 或 \superadmin\

#### **DELETE** \/delete/:dept_id\  删除部门

**权限**：\superadmin\

#### **POST** \/batch-create\  批量创建部门

**权限**：\superadmin\

### teamTermsRouter (\/api/team-terms\)  届次管理

#### **POST** \/create\  创建届次

**请求体**：
\\\json
{
  "term_name": "string (必填，如'第十届')",
  "start_date": "string? (YYYY-MM-DD)",
  "end_date": "string?",
  "is_current": "number? (0或1)",
  "remark": "string?"
}
\\\

#### **PUT** \/update/:term_id\  更新届次

#### **DELETE** \/delete/:term_id\  删除届次

#### **POST** \/batch-create\  批量创建届次

### backboneMembersRouter (\/api/backbone-members\)  骨干成员管理

#### **POST** \/create\  创建骨干成员

**请求体**：
\\\json
{
  "student_id": "string (必填，10位学号)",
  "dept_id": "number (必填)",
  "term_id": "number (必填)",
  "position": "队长 | 部长 | 副部长 | 部员?",
  "photo_key": "string? (OSS key)",
  "term_start": "string? (YYYY-MM-DD)",
  "term_end": "string?",
  "remark": "string?"
}
\\\

#### **PUT** \/update/:member_id\  更新骨干成员

#### **DELETE** \/delete/:member_id\  删除骨干成员

#### **POST** \/batch-create\  批量创建骨干成员

### activitiesRouter (\/api/activities\)  活动管理

后台包含"草稿"状态，需 \dmin\ 或 \superadmin\ 权限。

#### **POST** \/create\  创建活动

**请求体**：
\\\json
{
  "activity_name": "string (必填)",
  "dept_id": "number?",
  "term_id": "number?",
  "category": "string?",
  "cover_key": "string? (OSS key)",
  "recruitment_limit": "number?",
  "service_hours": "number?",
  "location": "string?",
  "start_time": "string? (ISO格式)",
  "end_time": "string?",
  "description": "string?",
  "status": "草稿 | 进行中 | 已结束?"
}
\\\

#### **PUT** \/update/:activity_id\  更新活动

#### **DELETE** \/delete/:activity_id\  删除活动

#### **PATCH** \/status/:activity_id\  切换活动状态

**请求体**：\{ "status": "草稿 | 进行中 | 已结束" }\

#### **GET** \/categories\  获取活动类别列表

#### **GET** \/page\  活动分页（含草稿）

**查询参数**：
- \page?, pageSize?\
- \search?: string\ (模糊搜索：活动名称、地点、描述)
- \status?: string\ (精确筛选)
- \category?: string\ (精确筛选)

#### **GET** \/list\  活动全量（含草稿）

### activityParticipantsRouter (\/api/activity-participants\)  活动报名

#### **GET** \/page/:activity_id\  活动报名分页

**权限**：\dmin\ 或 \superadmin\

**查询参数**：\page?, pageSize?\

#### **GET** \/list/:activity_id\  活动报名全量

**权限**：\dmin\ 或 \superadmin\

#### **POST** \/join\  学生报名活动

**请求体**：\{ "activity_id": "number", "role": "string?" }\

#### **DELETE** \/cancel/:activity_id/:student_id\  取消报名

#### **PATCH** \/signin/:record_id\  签到/取消签到

**权限**：\dmin\ 或 \superadmin\

**请求体**：\{ "signed_in": "0 | 1" }\

#### **PATCH** \/hours/:record_id\  更新服务时长

**权限**：\dmin\ 或 \superadmin\

**请求体**：\{ "service_hours": "number" }\

#### **PUT** \/hours/batch\  批量更新服务时长

**权限**：\dmin\ 或 \superadmin\

**请求体**：\{ "updates": [{ "record_id": "number", "service_hours": "number" }] }\

#### **GET** \/records/page/:student_id\  学生参与记录分页

**查询参数**：\page?, pageSize?\

#### **GET** \/records/list/:student_id\  学生参与记录全量

#### **GET** \/all/page\  全部报名记录分页

**权限**：\dmin\ 或 \superadmin\

**查询参数**：
- \page?, pageSize?\
- \search?: string\ (模糊搜索：学号、姓名、活动名称)

#### **GET** \/all/list\  全部报名记录全量

**权限**：\dmin\ 或 \superadmin\

### honorRecordsRouter (\/api/honor-records\)  荣誉管理

#### **POST** \/create\  创建荣誉记录

**请求体**：
\\\json
{
  "student_id": "string?",
  "term_id": "number?",
  "honor_title": "string (必填)",
  "honor_level": "string?",
  "issue_date": "string? (YYYY-MM-DD)",
  "issuer": "string?",
  "description": "string?",
  "certificate_key": "string? (OSS key)"
}
\\\

#### **PUT** \/update/:honor_id\  更新荣誉记录

#### **DELETE** \/delete/:honor_id\  删除荣誉记录

#### **POST** \/batch-create\  批量创建荣誉记录

### announcementsRouter (\/api/announcements\)  公告管理

需 \dmin\ 或 \superadmin\ 权限。

#### **POST** \/create\  创建公告

**请求体**：
\\\json
{
  "title": "string (必填)",
  "content": "string (必填，HTML)",
  "image_keys": "string? (逗号分隔OSS key)",
  "author_id": "string?",
  "term_id": "number?",
  "publish_time": "string? (ISO格式)",
  "status": "草稿 | 已发布 | 归档?",
  "file_key": "string? (OSS key)",
  "file_type": "none | pdf | word?"
}
\\\

#### **PUT** \/update/:announcement_id\  更新公告

#### **DELETE** \/delete/:announcement_id\  删除公告

#### **GET** \/list\  公告全量

#### **GET** \/page\  公告分页

**查询参数**：
- \page?, pageSize?\
- \search?: string\ (模糊搜索：标题、内容)
- \status?: string\ (精确筛选)

### galleryPhotosRouter (\/api/gallery-photos\)  相册管理

需 \dmin\ 或 \superadmin\ 权限。

#### **POST** \/create\  创建照片

**请求体**：
\\\json
{
  "term_id": "number?",
  "activity_id": "number?",
  "title": "string?",
  "image_key": "string (必填，OSS key)",
  "description": "string?",
  "uploaded_by": "string? (学号)",
  "sort_order": "number?"
}
\\\

#### **PUT** \/update/:photo_id\  更新照片

#### **DELETE** \/delete/:photo_id\  删除照片

#### **GET** \/page\  照片分页

**查询参数**：
- \page?, pageSize?\
- \search?: string\ (模糊搜索：标题、描述)
- \	erm_id?: number\ (精确筛选)

### teamMilestonesRouter (\/api/team-milestones\)  历程管理

#### **POST** \/create\  创建历程

**请求体**：
\\\json
{
  "term_id": "number?",
  "title": "string (必填)",
  "description": "string?",
  "event_date": "string (必填，YYYY-MM-DD)",
  "event_type": "string?",
  "image_key": "string? (OSS key)",
  "created_by": "string? (学号)"
}
\\\

#### **PUT** \/update/:milestone_id\  更新历程

#### **DELETE** \/delete/:milestone_id\  删除历程

#### **GET** \/page\  历程分页

**权限**：\dmin\ 或 \superadmin\

**查询参数**：
- \page?, pageSize?\
- \search?: string\ (模糊搜索：标题、描述)

#### **GET** \/list\  历程全量

**权限**：\dmin\ 或 \superadmin\

### operationLogsRouter (\/api/operation-logs\)  操作日志

需 \dmin\ 或 \superadmin\ 权限。

#### **GET** \/list\  操作日志分页

**查询参数**：
- \page?, pageSize?\
- \user_id?: string\ (精确筛选用户)
- \ction?: string\ (精确筛选操作类型)
- \start_date?: string\ (YYYY-MM-DD)
- \end_date?: string\

#### **GET** \/:log_id\  获取操作日志详情

### ossRouter/stsRouter (\/api/oss\ 或 \/api/sts\)  对象存储

#### **GET** \/sts\  获取OSS STS临时凭证

**返回**：
\\\json
{
  "code": 200,
  "success": true,
  "message": "获取成功",
  "data": {
    "accessKeyId": "string",
    "accessKeySecret": "string",
    "securityToken": "string",
    "expiration": "string (ISO时间)",
    "bucket": "string (Bucket名称)",
    "region": "string (区域)",
    "endpoint": "string (端点)"
  }
}
\\\

### recruitmentSeasonsRouter (\/api/recruitment-seasons\)  纳新通道

#### **GET** \/current\  获取当前开放通道（公开）

#### **GET** \/list\  通道列表

**权限**：\dmin\ 或 \superadmin\

#### **POST** \/open\  开启通道

**权限**：\dmin\ 或 \superadmin\

**请求体**：
\\\json
{
  "year": "number (如2025)",
  "type": "new_student | internal_election",
  "title": "string (4-100字符)"
}
\\\

#### **POST** \/close-all\  关闭全部通道

**权限**：\dmin\ 或 \superadmin\

#### **POST** \/close\  关闭指定通道

**权限**：\dmin\ 或 \superadmin\

#### **POST** \/delete\  删除通道

**权限**：\dmin\ 或 \superadmin\

### teamRecruitmentRouter (\/api/team-recruitment\)  纳新报名

#### **POST** \/create\  学生提交报名

**请求体**：
\\\json
{
  "recruitment_type": "new_student | internal_election (必填)",
  "intention_dept1": "string (必填，第一志愿部门名称)",
  "intention_dept2": "string? (第二志愿)",
  "self_intro": "string (必填，自我介绍)",
  "past_experience": "string?",
  "reason_for_joining": "string (必填，50-2000字)",
  "skill_tags": "string[]?",
  "current_position": "string? (换届专用)",
  "election_position": "string? (换届专用)",
  "work_plan": "string? (换届专用，100字)"
}
\\\

#### **GET** \/page\  报名分页

**权限**：\dmin\ 或 \superadmin\

**查询参数**：
- \year?: number\
- \	ype?: string\ (new_student | internal_election)
- \status?: string\
- \page?, pageSize?\
- \search?: string\ (模糊搜索：学号、姓名、邮箱)

**纳新状态值**：\pending_review | interview1_passed | interview1_failed | interview2_passed | interview2_failed | pending_assignment | assigned | rejected\

#### **GET** \/department-applicants/page\  部门报名分页

**权限**：\dmin\（仅负责部门）

**查询参数**：
- \page?, pageSize?\
- \search?: string\ (模糊搜索：学号、姓名)

#### **POST** \/review\  审核报名（一面/二面）

**权限**：\dmin\ 或 \superadmin\

**请求体**：
\\\json
{
  "year": "number (必填)",
  "student_ids": ["string", ...] (必填，学号列表),
  "stage": "1 | 2 (必填，第几面)",
  "pass": "boolean (必填)",
  "remark": "string?"
}
\\\

#### **POST** \/assign\  最终任命/分配部门

**权限**：\dmin\ 或 \superadmin\

**请求体**：
\\\json
{
  "year": "number (必填)",
  "student_ids": ["string", ...] (必填),
  "department": "string (必填，部门名称)",
  "position": "string? (职位)"
}
\\\

---

## 关键说明

### 模糊搜索(search)的字段
见各接口的"查询参数"说明，**不同接口搜索字段不同**，前端需按文档实现。

### 精确筛选字段
通过专门的查询参数（status、category、role等）进行精确值匹配。

### 授权
- 公开接口：无需 Authorization
- 受保护接口：\Authorization: Bearer <token>\

### 分页默认值
- \page=1\, \pageSize=20\
- \total\ 为总记录数

### 日期格式
- 日期：\YYYY-MM-DD\
- 日期时间：ISO 8601 (如 2025-01-09T14:30:00Z)

### 状态枚举
- **活动状态**：\草稿 | 进行中 | 已结束\
- **公告状态**：\草稿 | 已发布 | 归档\
- **用户角色**：\user | admin | superadmin\
- **骨干职位**：\队长 | 部长 | 副部长 | 部员\
- **纳新类型**：\new_student | internal_election\
- **纳新状态**：见上述 team-recruitment 接口

---

**文档最后更新**：2026年1月9日
