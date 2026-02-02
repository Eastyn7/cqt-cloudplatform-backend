/**
 * 定时任务相关类型定义
 */

// TaskConfig（任务配置表）
export interface TaskConfigRecord {
  id: number;
  task_code: string;
  task_name: string;
  enabled: number;
  cron_expr: string;
  last_run_at: string | null;
  last_result: string | null;
  remark: string | null;
  created_at: string;
  updated_at: string;
}

export type TaskConfigWritable = Omit<
  TaskConfigRecord,
  'id' | 'created_at' | 'updated_at' | 'last_run_at' | 'last_result'
>;

export const TaskConfigWritableFields: (keyof TaskConfigWritable)[] = [
  'task_code',
  'task_name',
  'enabled',
  'cron_expr',
  'remark',
];

// TaskLog（任务执行日志表）
export interface TaskLogRecord {
  id: number;
  task_code: string;
  started_at: string;
  finished_at: string;
  success: number;
  message: string | null;
  affected_rows: number;
  exec_ms: number;
  created_at: string;
}

export type TaskLogWritable = Omit<
  TaskLogRecord,
  'id' | 'created_at'
>;

// 任务执行结果
export interface TaskExecutionResult {
  task_code: string;
  success: boolean;
  affected_rows: number;
  message: string;
  ran_at: string;
  exec_ms: number;
}
