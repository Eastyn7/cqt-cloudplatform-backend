# API Endpoints Documentation

This document lists all API endpoints extracted from the router files in the `src/routers` directory. All routes are prefixed with `/api`.

## General Response Format

All API responses follow a unified format:

### Success Response
```json
{
  "code": 200,
  "success": true,
  "message": "Success message",
  "data": <response_data>
}
```

### Error Response
```json
{
  "code": <error_code>,
  "success": false,
  "message": "Error message",
  "debug": "<debug_info>" // Only in development mode
}
```

## Request Parameters

Request parameters are validated using schemas defined in `validateSchemas.ts`. Parameters can be in:
- **Body**: JSON payload for POST/PUT/PATCH requests
- **Query**: URL query parameters for GET requests
- **Params**: URL path parameters (e.g., :id)

Below, each endpoint lists its validation schema and inferred parameters.

**Note:** For detailed field validation rules, refer to `src/validators/validateSchemas.ts`. All responses follow the general format above. For GET endpoints, parameters are in query or path. For POST/PUT/PATCH, in body.

## publicRouter (/api/public)
- **POST** `/api/public/email/send`  
  Validation: `validateSendEmailCode`  
  Controller: `sendVerificationCodeController`  
  Description: 发送验证码  
  **Request Body:** `{ email: string (required), type?: string }`  
  **Response:** `{ code: 200, success: true, message: "验证码发送成功", data: null }`

- **POST** `/api/public/email/verify`  
  Validation: `validateVerifyEmailCode`  
  Controller: `verifyEmailCodeController`  
  Description: 校验验证码  
  **Request Body:** `{ email: string (required), code: string (required), type?: string }`  
  **Response:** `{ code: 200, success: true, message: "验证码校验成功", data: null }`

- **POST** `/api/public/auth/register`  
  Validation: `validateRegistration`  
  Controller: `registerController`  
  Description: 注册  
  **Request Body:** `{ student_id: string (required), email: string (required), password: string (required), name: string (required), code: string (required) }`  
  **Response:** `{ code: 200, success: true, message: "注册成功", data: userInfo }`

- **POST** `/api/public/auth/login`  
  Validation: `validateLogin`  
  Controller: `loginController`  
  Description: 登录  
  **Request Body:** `{ loginInput: string (required), password: string (required) }`  
  **Response:** `{ code: 200, success: true, message: "登录成功", data: { token: string, user: object } }`

- **POST** `/api/public/auth/change-password`  
  Validation: `validateChangePassword`  
  Controller: `changePasswordController`  
  Description: 修改密码  
  **Request Body:** `{ email: string (required), oldPassword: string (required), newPassword: string (required), code: string (required) }`  
  **Response:** `{ code: 200, success: true, message: "密码修改成功", data: null }`

- **GET** `/api/public/departments/list`  
  Validation: None  
  Controller: `getAllDepartmentsController`  
  Description: 获取部门全量列表  
  **Request:** None  
  **Response:** `{ code: 200, success: true, message: "查询所有部门成功", data: [departments] }`

- **GET** `/api/public/departments/page`  
  Validation: None  
  Controller: `getDepartmentsPageController`  
  Description: 获取部门分页列表  
  **Request Query:** `{ page?: number, pageSize?: number, search?: string }`  
  **Search Fields:** dept_name, leader_id, leader_name (模糊匹配)  
  **Response:** `{ code: 200, success: true, message: "分页查询部门成功", data: { list: [departments], pagination: { page, pageSize, total, totalPages } } }`

- **GET** `/api/public/departments/:dept_id`  
  Validation: None  
  Controller: `getDepartmentByIdController`  
  Description: 获取部门详情  
  **Request Params:** `{ dept_id: string }`  
  **Response:** `{ code: 200, success: true, message: "查询部门成功", data: department }`

- **GET** `/api/public/team-terms/page`  
  Validation: None  
  Controller: `getAllTeamTermsPageController`  
  Description: 获取届次列表（分页）  
  **Request Query:** `{ page?: number, pageSize?: number, search?: string }`  
  **Search Fields:** term_name (模糊匹配)  
  **Response:** `{ code: 200, success: true, message: "分页查询届次成功", data: { list: [terms], pagination: { page, pageSize, total, totalPages } } }`

- **GET** `/api/public/team-terms/list`  
  Validation: None  
  Controller: `getAllTeamTermsController`  
  Description: 获取届次列表（全量）  
  **Request:** None  
  **Response:** `{ code: 200, success: true, message: "查询所有届次成功", data: [terms] }`

- **GET** `/api/public/team-terms/:term_id`  
  Validation: None  
  Controller: `getTeamTermByIdController`  
  Description: 获取届次详情  
  **Request Params:** `{ term_id: string }`  
  **Response:** `{ code: 200, success: true, message: "查询届次成功", data: term }`

- **GET** `/api/public/backbone-members/page`  
  Validation: None  
  Controller: `getAllBackboneMembersPageController`  
  Description: 获取骨干成员分页列表  
  **Request Query:** `{ page?: number, pageSize?: number, search?: string }`  
  **Search Fields:** name, student_id, dept_name, position, term_name (模糊匹配)  
  **Response:** `{ code: 200, success: true, message: "分页查询骨干成员成功", data: { list: [members], pagination: { page, pageSize, total, totalPages } } }`

- **GET** `/api/public/backbone-members/all`  
  Validation: None  
  Controller: `getAllBackboneMembersController`  
  Description: 获取骨干成员全量列表  
  **Request:** None  
  **Response:** `{ code: 200, success: true, message: "查询所有骨干成员成功", data: [members] }`

- **GET** `/api/public/backbone-members/tree`  
  Validation: None  
  Controller: `getBackboneTreeController`  
  Description: 获取骨干成员树  
  **Request:** None  
  **Response:** `{ code: 200, success: true, message: "查询骨干成员树成功", data: tree }`

- **GET** `/api/public/activities/page`  
  Validation: None  
  Controller: `getAllActivitiesPageController`  
  Description: 获取活动分页列表  
  **Request Query:** `{ page?: number, pageSize?: number, search?: string, status?: string, category?: string }`  
  **Search Fields:** activity_name, dept_name, location (模糊匹配)  
  **Response:** `{ code: 200, success: true, message: "分页查询活动成功", data: { list: [activities], pagination: { page, pageSize, total, totalPages } } }`

- **GET** `/api/public/activities/all`  
  Validation: None  
  Controller: `getAllActivitiesController`  
  Description: 获取活动全量列表  
  **Request:** None  
  **Response:** `{ code: 200, success: true, message: "查询所有活动成功", data: [activities] }`

- **GET** `/api/public/activities/:activity_id`  
  Validation: None  
  Controller: `getActivityByIdController`  
  Description: 获取活动详情  
  **Request Params:** `{ activity_id: string }`  
  **Response:** `{ code: 200, success: true, message: "查询活动成功", data: activity }`

- **GET** `/api/public/honor-records/page`  
  Validation: None  
  Controller: `getHonorRecordsPageController`  
  Description: 获取荣誉记录分页列表  
  **Request Query:** `{ page?: number, pageSize?: number, search?: string, honor_level?: string, term_id?: string }`  
  **Search Fields:** honor_title, name, student_id, issuer (模糊匹配)  
  **Response:** `{ code: 200, success: true, message: "分页查询荣誉记录成功", data: { list: [records], pagination: { page, pageSize, total, totalPages } } }`

- **GET** `/api/public/honor-records/list`  
  Validation: None  
  Controller: `getAllHonorRecordsController`  
  Description: 获取荣誉记录全量列表  
  **Request:** None  
  **Response:** `{ code: 200, success: true, message: "查询所有荣誉记录成功", data: [records] }`

- **GET** `/api/public/honor-records/wall/list`  
  Validation: None  
  Controller: `getHonorWallController`  
  Description: 获取荣誉墙  
  **Request:** None  
  **Response:** `{ code: 200, success: true, message: "查询荣誉墙成功", data: [records] }`

- **GET** `/api/public/honor-records/wall/page`  
  Validation: None  
  Controller: `getHonorWallPageController`  
  Description: 获取荣誉墙分页  
  **Request Query:** `{ page?: number, pageSize?: number }`  
  **Response:** `{ code: 200, success: true, message: "分页查询荣誉墙成功", data: { list: [records], pagination: { page, pageSize, total, totalPages } } }`

- **GET** `/api/public/announcements/published`  
  Validation: None  
  Controller: `getPublishedAnnouncementsController`  
  Description: 获取已发布公告  
  **Request:** None  
  **Response:** `{ code: 200, success: true, message: "查询已发布公告成功", data: [announcements] }`

- **GET** `/api/public/gallery-photos/term/:term_id`  
  Validation: None  
  Controller: `getPhotosByTermController`  
  Description: 获取届次照片  
  **Request Params:** `{ term_id: string }`  
  **Response:** `{ code: 200, success: true, message: "查询届次照片成功", data: [photos] }`

- **GET** `/api/public/gallery-photos/activity/:activity_id`  
  Validation: None  
  Controller: `getPhotosByActivityController`  
  Description: 获取活动照片  
  **Request Params:** `{ activity_id: string }`  
  **Response:** `{ code: 200, success: true, message: "查询活动照片成功", data: [photos] }`

- **GET** `/api/public/team-milestones/term/page/:term_id`  
  Validation: None  
  Controller: `getMilestonesByTermPageController`  
  Description: 获取届次历程（分页）  
  **Request Params:** `{ term_id: string }`  
  **Request Query:** `{ page?: number, pageSize?: number }`  
  **Response:** `{ code: 200, success: true, message: "分页查询届次历程成功", data: { list: [milestones], pagination: { page, pageSize, total, totalPages } } }`

- **GET** `/api/public/team-milestones/term/list/:term_id`  
  Validation: None  
  Controller: `getMilestonesByTermController`  
  Description: 获取届次历程（全量）  
  **Request Params:** `{ term_id: string }`  
  **Response:** `{ code: 200, success: true, message: "查询届次历程成功", data: [milestones] }`

- **GET** `/api/public/team-milestones/type/page/:event_type`  
  Validation: None  
  Controller: `getMilestonesByTypePageController`  
  Description: 按事件类型获取历程（分页）  
  **Request Params:** `{ event_type: string }`  
  **Request Query:** `{ page?: number, pageSize?: number }`  
  **Response:** `{ code: 200, success: true, message: "分页查询事件类型历程成功", data: { list: [milestones], pagination: { page, pageSize, total, totalPages } } }`

- **GET** `/api/public/team-milestones/type/list/:event_type`  
  Validation: None  
  Controller: `getMilestonesByTypeController`  
  Description: 按事件类型获取历程（全量）  
  **Request Params:** `{ event_type: string }`  
  **Response:** `{ code: 200, success: true, message: "查询事件类型历程成功", data: [milestones] }`

- **GET** `/api/public/team-milestones/date-range/page`  
  Validation: None  
  Controller: `getMilestonesByDateRangePageController`  
  Description: 按时间范围获取历程（分页）  
  **Request Query:** `{ start_date?: string, end_date?: string, page?: number, pageSize?: number }`  
  **Response:** `{ code: 200, success: true, message: "分页查询时间范围历程成功", data: { list: [milestones], pagination: { page, pageSize, total, totalPages } } }`

- **GET** `/api/public/team-milestones/date-range/list`  
  Validation: None  
  Controller: `getMilestonesByDateRangeController`  
  Description: 按时间范围获取历程（全量）  
  **Request Query:** `{ start_date?: string, end_date?: string }`  
  **Response:** `{ code: 200, success: true, message: "查询时间范围历程成功", data: [milestones] }`

## emailRouter (/api/email)
- **DELETE** `/api/email/cleanup`  
  Validation: None  
  Controller: `cleanupVerificationCodesController`  
  Description: 清理验证码记录

- **GET** `/api/email/list`  
  Validation: None  
  Controller: `getAllVerificationCodesController`  
  Description: 获取验证码列表（分页/筛选）

## authLoginRouter (/api/auth/login)
- **POST** `/api/auth/login/batch-register`  
  Validation: `validateBatchRegister`  
  Controller: `batchRegisterController`  
  Description: 批量注册

- **DELETE** `/api/auth/login/delete/:student_id`  
  Validation: None  
  Controller: `deleteUserController`  
  Description: 删除单个用户

- **POST** `/api/auth/login/delete/batch`  
  Validation: `validateBatchDelete`  
  Controller: `batchDeleteUsersController`  
  Description: 批量删除

- **GET** `/api/auth/login/admin/list-page`  
  Validation: None  
  Controller: `getAllAdminsPageController`  
  Description: 获取所有管理员（分页）

- **GET** `/api/auth/login/admin/list`  
  Validation: None  
  Controller: `getAllAdminsController`  
  Description: 获取所有管理员（全量）

- **POST** `/api/auth/login/admin/set-single`  
  Validation: `validateSetAdmin`  
  Controller: `setAdminController`  
  Description: 设置单个管理员

- **POST** `/api/auth/login/admin/set`  
  Validation: `validateBatchSetUserRoles`  
  Controller: `batchSetUserRolesController`  
  Description: 批量设置用户角色（可设置为 admin 或 superadmin）

- **POST** `/api/auth/login/admin/remove`  
  Validation: `validateSetAdmin`  
  Controller: `removeAdminController`  
  Description: 取消管理员身份

- **GET** `/api/auth/login/users/search`  
  Validation: None  
  Controller: `searchUsersController`  
  Description: 搜索用户

## authInfoRouter (/api/auth/info)
- **PUT** `/api/auth/info/update/:student_id`  
  Validation: `validateAuthInfoUpdate`  
  Controller: `updateUserInfoController`  
  Description: 更新单个用户信息

- **GET** `/api/auth/info/info/:student_id`  
  Validation: None  
  Controller: `getUserInfoController`  
  Description: 查询单个用户信息  
  **Request Params:** `{ student_id: string }`  
  **Response:** `{ code: 200, success: true, message: "查询用户信息成功", data: user }`

- **GET** `/api/auth/info/page`  
  Validation: None  
  Controller: `getUsersInfoPageController`  
  Description: 分页查询用户信息  
  **Request Query:** `{ page?: number, pageSize?: number, search?: string, role?: string, college?: string, major?: string }`  
  **Search Fields:** name, student_id, email, phone (模糊匹配)  
  **Response:** `{ code: 200, success: true, message: "分页查询用户信息成功", data: { list: [users], pagination: { page, pageSize, total, totalPages } } }`

- **GET** `/api/auth/info/all`  
  Validation: None  
  Controller: `getAllUsersInfoController`  
  Description: 查询所有用户信息（一次性）  
  **Request:** None  
  **Response:** `{ code: 200, success: true, message: "查询所有用户信息成功", data: [users] }`

- **POST** `/api/auth/info/batch-import`  
  Validation: `validateBatchAuthInfoCreate`  
  Controller: `batchImportUsersInfoController`  
  Description: 批量导入 / 更新用户信息

- **GET** `/api/auth/info/colleges-majors`  
  Validation: None  
  Controller: `getCollegesAndMajorsController`  
  Description: 获取所有用户学院和专业

- **GET** `/api/auth/info/admins`  
  Validation: None  
  Controller: `getAllAdminsInfoController`  
  Description: 获取所有管理员信息

## departmentsRouter (/api/departments)
- **POST** `/api/departments/create`  
  Validation: `validateDepartmentCreate`  
  Controller: `createDepartmentController`  
  Description: 创建部门

- **PUT** `/api/departments/update/:dept_id`  
  Validation: `validateDepartmentUpdate`  
  Controller: `updateDepartmentController`  
  Description: 更新部门信息

- **DELETE** `/api/departments/delete/:dept_id`  
  Validation: None  
  Controller: `deleteDepartmentController`  
  Description: 删除部门

- **POST** `/api/departments/batch-create`  
  Validation: `validateBatchDepartmentCreate`  
  Controller: `batchCreateDepartmentsController`  
  Description: 批量创建部门

## teamTermsRouter (/api/team-terms)
- **POST** `/api/team-terms/create`  
  Validation: `validateTeamTermCreate`  
  Controller: `createTeamTermController`  
  Description: 创建届次

- **PUT** `/api/team-terms/update/:term_id`  
  Validation: `validateTeamTermUpdate`  
  Controller: `updateTeamTermController`  
  Description: 更新届次信息

- **DELETE** `/api/team-terms/delete/:term_id`  
  Validation: None  
  Controller: `deleteTeamTermController`  
  Description: 删除届次

- **POST** `/api/team-terms/batch-create`  
  Validation: `validateBatchTeamTermCreate`  
  Controller: `batchCreateTeamTermsController`  
  Description: 批量创建届次

## backboneMembersRouter (/api/backbone-members)
- **POST** `/api/backbone-members/create`  
  Validation: `validateBackboneMemberCreate`  
  Controller: `createBackboneMemberController`  
  Description: 创建骨干成员

- **PUT** `/api/backbone-members/update/:member_id`  
  Validation: `validateBackboneMemberUpdate`  
  Controller: `updateBackboneMemberController`  
  Description: 更新骨干成员信息

- **DELETE** `/api/backbone-members/delete/:member_id`  
  Validation: None  
  Controller: `deleteBackboneMemberController`  
  Description: 删除骨干成员

- **POST** `/api/backbone-members/batch-create`  
  Validation: `validateBatchBackboneMemberCreate`  
  Controller: `batchCreateBackboneMembersController`  
  Description: 批量创建骨干成员

## activitiesRouter (/api/activities)
- **POST** `/api/activities/create`  
  Validation: `validateActivityCreate`  
  Controller: `createActivityController`  
  Description: 创建志愿活动

- **PUT** `/api/activities/update/:activity_id`  
  Validation: `validateActivityUpdate`  
  Controller: `updateActivityController`  
  Description: 更新志愿活动

- **DELETE** `/api/activities/delete/:activity_id`  
  Validation: None  
  Controller: `deleteActivityController`  
  Description: 删除志愿活动

- **PATCH** `/api/activities/status/:activity_id`  
  Validation: `validateActivityUpdate`  
  Controller: `changeActivityStatusController`  
  Description: 切换活动状态

- **GET** `/api/activities/categories`  
  Validation: None  
  Controller: `getActivityCategoriesController`  
  Description: 获取所有活动的活动类别

## activityParticipantsRouter (/api/activity-participants)
- **GET** `/api/activity-participants/page/:activity_id`  
  Validation: None  
  Controller: `getParticipantsByActivityController`  
  Description: 获取活动报名名单  
  **Request Params:** `{ activity_id: string }`  
  **Response:** `{ code: 200, success: true, message: "查询活动报名名单成功", data: [participants] }`

- **GET** `/api/activity-participants/list/:activity_id`  
  Validation: None  
  Controller: `getAllParticipantsByActivityController`  
  Description: 获取活动报名名单（全量）  
  **Request Params:** `{ activity_id: string }`  
  **Response:** `{ code: 200, success: true, message: "查询活动报名名单成功", data: [participants] }`

- **POST** `/api/activity-participants/join`  
  Validation: `validateActivityParticipantCreate`  
  Controller: `joinActivityController`  
  Description: 学生报名活动

- **DELETE** `/api/activity-participants/cancel/:activity_id/:student_id`  
  Validation: None  
  Controller: `cancelActivityController`  
  Description: 取消活动报名

- **PATCH** `/api/activity-participants/signin/:record_id`  
  Validation: `validateActivityParticipantUpdate`  
  Controller: `markSignInController`  
  Description: 活动签到/取消签到

- **PATCH** `/api/activity-participants/hours/:record_id`  
  Validation: `validateActivityParticipantUpdate`  
  Controller: `updateServiceHoursController`  
  Description: 单个更新服务时长

- **PUT** `/api/activity-participants/hours/batch`  
  Validation: `validateBatchActivityParticipantUpdate`  
  Controller: `batchUpdateServiceHoursController`  
  Description: 批量更新服务时长

- **GET** `/api/activity-participants/records/page/:student_id`  
  Validation: None  
  Controller: `getRecordsByStudentPageController`  
  Description: 查询学生个人报名记录（分页）  
  **Request Params:** `{ student_id: string }`  
  **Request Query:** `{ page?: number, pageSize?: number }`  
  **Response:** `{ code: 200, success: true, message: "分页查询学生报名记录成功", data: { list: [records], pagination: { page, pageSize, total, totalPages } } }`

- **GET** `/api/activity-participants/records/list/:student_id`  
  Validation: None  
  Controller: `getRecordsByStudentController`  
  Description: 查询学生个人报名记录（全量）  
  **Request Params:** `{ student_id: string }`  
  **Response:** `{ code: 200, success: true, message: "查询学生报名记录成功", data: [records] }`

- **GET** `/api/activity-participants/all/page`  
  Validation: None  
  Controller: `getAllParticipantsPageController`  
  Description: 查询所有活动参与记录（分页）  
  **Request Query:** `{ page?: number, pageSize?: number, search?: string }`  
  **Search Fields:** activity_name, name, student_id, college (模糊匹配)  
  **Response:** `{ code: 200, success: true, message: "分页查询所有活动参与记录成功", data: { list: [participants], pagination: { page, pageSize, total, totalPages } } }`

- **GET** `/api/activity-participants/all/list`  
  Validation: None  
  Controller: `getAllParticipantsController`  
  Description: 查询所有活动参与记录（全量）  
  **Request:** None  
  **Response:** `{ code: 200, success: true, message: "查询所有活动参与记录成功", data: [participants] }`

## honorRecordsRouter (/api/honor-records)
- **POST** `/api/honor-records/create`  
  Validation: `validateHonorCreate`  
  Controller: `createHonorRecordController`  
  Description: 创建荣誉记录

- **PUT** `/api/honor-records/update/:honor_id`  
  Validation: `validateHonorUpdate`  
  Controller: `updateHonorRecordController`  
  Description: 更新荣誉记录

- **DELETE** `/api/honor-records/delete/:honor_id`  
  Validation: None  
  Controller: `deleteHonorRecordController`  
  Description: 删除荣誉记录

- **POST** `/api/honor-records/batch-create`  
  Validation: `validateBatchHonorCreate`  
  Controller: `batchCreateHonorRecordsController`  
  Description: 批量创建荣誉记录

## announcementsRouter (/api/announcements)
- **POST** `/api/announcements/create`  
  Validation: `validateAnnouncementCreate`  
  Controller: `createAnnouncementController`  
  Description: 创建公告

- **PUT** `/api/announcements/update/:announcement_id`  
  Validation: `validateAnnouncementUpdate`  
  Controller: `updateAnnouncementController`  
  Description: 更新公告

- **DELETE** `/api/announcements/delete/:announcement_id`  
  Validation: None  
  Controller: `deleteAnnouncementController`  
  Description: 删除公告

- **GET** `/api/announcements/list`  
  Validation: None  
  Controller: `getAllAnnouncementsController`  
  Description: 获取全部公告

- **GET** `/api/announcements/page`  
  Validation: None  
  Controller: `getAnnouncementsPageController`  
  Description: 分页查询公告  
  **Request Query:** `{ page?: number, pageSize?: number, search?: string, status?: string }`  
  **Search Fields:** title, term_name, author (模糊匹配)  
  **Response:** `{ code: 200, success: true, message: "分页查询公告成功", data: { list: [announcements], pagination: { page, pageSize, total, totalPages } } }`

## galleryPhotosRouter (/api/gallery-photos)
- **POST** `/api/gallery-photos/create`  
  Validation: `validateGalleryPhotoCreate`  
  Controller: `createPhotoController`  
  Description: 后台创建照片

- **PUT** `/api/gallery-photos/update/:photo_id`  
  Validation: `validateGalleryPhotoUpdate`  
  Controller: `updatePhotoController`  
  Description: 后台更新照片

- **DELETE** `/api/gallery-photos/delete/:photo_id`  
  Validation: None  
  Controller: `deletePhotoController`  
  Description: 删除照片

- **GET** `/api/gallery-photos/page`  
  Validation: None  
  Controller: `getAllPhotosController`  
  Description: 后台照片列表  
  **Request Query:** `{ page?: number, pageSize?: number, search?: string, term_id?: string }`  
  **Search Fields:** title, description (模糊匹配)  
  **Response:** `{ code: 200, success: true, message: "分页查询照片成功", data: { list: [photos], pagination: { page, pageSize, total, totalPages } } }`

## teamMilestonesRouter (/api/team-milestones)
- **POST** `/api/team-milestones/create`  
  Validation: `validateTeamMilestoneCreate`  
  Controller: `createMilestoneController`  
  Description: 创建里程碑

- **PUT** `/api/team-milestones/update/:milestone_id`  
  Validation: `validateTeamMilestoneUpdate`  
  Controller: `updateMilestoneController`  
  Description: 更新里程碑

- **DELETE** `/api/team-milestones/delete/:milestone_id`  
  Validation: None  
  Controller: `deleteMilestoneController`  
  Description: 删除里程碑

- **GET** `/api/team-milestones/page`  
  Validation: None  
  Controller: `getAllMilestonesPageController`  
  Description: 后台里程碑列表（分页）  
  **Request Query:** `{ page?: number, pageSize?: number, search?: string }`  
  **Search Fields:** title, description, term_name (模糊匹配)  
  **Response:** `{ code: 200, success: true, message: "分页查询里程碑成功", data: { list: [milestones], pagination: { page, pageSize, total, totalPages } } }`

- **GET** `/api/team-milestones/list`  
  Validation: None  
  Controller: `getAllMilestonesController`  
  Description: 后台里程碑列表（全量）  
  **Request:** None  
  **Response:** `{ code: 200, success: true, message: "查询所有里程碑成功", data: [milestones] }`

## operationLogsRouter (/api/operation-logs)
- **GET** `/api/operation-logs/list`  
  Validation: None  
  Controller: `getLogsController`  
  Description: 操作日志分页查询  
  **Request Query:** `{ page?: number, pageSize?: number, user_id?: string, action?: string, start_date?: string, end_date?: string }`  
  **Response:** `{ code: 200, success: true, message: "分页查询操作日志成功", data: { list: [logs], pagination: { page, pageSize, total, totalPages } } }`

- **GET** `/api/operation-logs/:log_id`  
  Validation: None  
  Controller: `getLogByIdController`  
  Description: 操作日志单条查询（按log_id）  
  **Request Params:** `{ log_id: string }`  
  **Response:** `{ code: 200, success: true, message: "查询操作日志成功", data: log }`

## stsRouter (/api/oss)
- **GET** `/api/oss/sts`  
  Validation: None  
  Controller: `getSTS`  
  Description: 获取 OSS 上传用的 STS 临时凭证

## recruitmentSeasonsRouter (/api/recruitment-seasons)
- **GET** `/api/recruitment-seasons/current`  
  Validation: None  
  Controller: `getCurrentController`  
  Description: 用户端：获取当前可报名的通道  
  **Request:** None  
  **Response:** `{ code: 200, success: true, message: "获取当前报名通道成功", data: season }`

- **GET** `/api/recruitment-seasons/list`  
  Validation: None  
  Controller: `listController`  
  Description: 管理端：获取所有列表  
  **Request:** None  
  **Response:** `{ code: 200, success: true, message: "获取所有报名通道成功", data: [seasons] }`

- **POST** `/api/recruitment-seasons/open`  
  Validation: `validateSeasonControl`  
  Controller: `openController`  
  Description: 开启新一季报名

- **POST** `/api/recruitment-seasons/close-all`  
  Validation: None  
  Controller: `closeAllController`  
  Description: 关闭所有报名通道

- **POST** `/api/recruitment-seasons/close`  
  Validation: None  
  Controller: `closeOneController`  
  Description: 关闭指定报名通道

- **POST** `/api/recruitment-seasons/delete`  
  Validation: None  
  Controller: `deleteController`  
  Description: 删除报名通道（用于清理错误配置）

## teamRecruitmentRouter (/api/team-recruitment)
- **POST** `/api/team-recruitment/create`  
  Validation: `validateRecruitmentApply`  
  Controller: `submitApplyController`  
  Description: 学生提交报名

- **GET** `/api/team-recruitment/page`  
  Validation: None  
  Controller: `getAdminPageController`  
  Description: 分页查询报名列表（超级管理员专用）  
  **Request Query:** `{ year?: number, type?: string, status?: string, page?: number, pageSize?: number, search?: string }`  
  **Search Fields:** student_id, name (模糊匹配)  
  **Response:** `{ code: 200, success: true, message: "分页查询报名列表成功", data: { list: [applications], pagination: { page, pageSize, total, totalPages } } }`

- **GET** `/api/team-recruitment/department-applicants/page`  
  Validation: None  
  Controller: `getDepartmentApplicantsController`  
  Description: 部门管理员查看本部门所有报名  
  **Request Query:** `{ page?: number, pageSize?: number, search?: string }`  
  **Search Fields:** student_id, name (模糊匹配)  
  **Response:** `{ code: 200, success: true, message: "查询部门报名成功", data: { list: [applications], year, pagination: { page, pageSize, total, totalPages } } }`

- **POST** `/api/team-recruitment/review`  
  Validation: `validateReviewStage`  
  Controller: `reviewStageController`  
  Description: 审核面试结果（批量）

- **POST** `/api/team-recruitment/assign`  
  Validation: `validateAssignDept`  
  Controller: `assignFinalController`  
  Description: 最终任命/分配