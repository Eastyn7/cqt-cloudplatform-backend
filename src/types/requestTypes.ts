// 注册请求体
export interface RegisterRequestBody {
  student_id: string;
  email: string;
  password: string;
  name: string;
  code: string;
}

// 登录请求体（loginInput 支持学号/邮箱）
export interface LoginRequestBody {
  loginInput: string;
  password: string;
}

// 重置密码请求体
export interface ResetPasswordRequestBody {
  email: string;
  oldPassword: string;
  newPassword: string;
  code: string;
}

// 设置管理员请求体
export interface SetAdminRequestBody {
  student_id: string;
}

// 批量设置用户角色请求体
export interface BatchSetUserRolesRequestBody {
  userRoles: {
    student_id: string;
    role: 'user' | 'admin' | 'superadmin';
  }[];
}

// 搜索用户请求体（查询参数）
export interface SearchUsersQuery {
  q: string;
}

// 分页查询基础参数
export interface PaginationQuery {
  page?: number | string;
  pageSize?: number | string;
  search?: string;
}