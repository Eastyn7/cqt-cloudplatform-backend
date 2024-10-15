// 定义数据传输对象类型
export interface User {
  auth_id: number;
  student_id: string;
  email: string;
  password_hash: string;
}

export interface RegisterUser {
  auth_id: number;
  student_id: string;
  email: string;
}
