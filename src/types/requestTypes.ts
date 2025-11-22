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