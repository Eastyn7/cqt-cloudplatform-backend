import { Request, Response, NextFunction } from 'express';
import chalk from 'chalk';
import logger from '../utils/logger';
import { query } from '../db';

/** 接口性能统计类型：请求次数+总耗时(ms) */
type MetricsStat = {
  count: number;
  totalTime: number;
};

const metrics: Map<string, MetricsStat> = new Map();
// 性能统计输出间隔（默认5分钟，支持环境变量配置）
const METRICS_FLUSH_INTERVAL = Number(process.env.METRICS_FLUSH_INTERVAL_MS) || 5 * 60 * 1000;

/** 定期输出API性能汇总（按接口分组，含请求数和平均耗时） */
const flushMetrics = () => {
  if (metrics.size === 0) return;
  const rows: string[] = [];
  metrics.forEach((stat, key) => {
    const avg = stat.totalTime / stat.count;
    rows.push(`${key} => count=${stat.count}, avg=${avg.toFixed(2)}ms`);
  });
  logger.info(`🧮 API性能统计:\n${rows.join('\n')}`);
};
setInterval(flushMetrics, METRICS_FLUSH_INTERVAL);

/** 日志中间件：彩色控制台输出+文件日志+数据库操作日志+接口性能统计 */
export const logMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const { method, originalUrl } = req;

  res.on('finish', async () => {
    const duration = Date.now() - start;
    const status = res.statusCode;

    // 用户身份信息（优先student_id/user_id，默认guest）
    const user = (req as any).user || {};
    const studentId = user?.student_id || user?.user_id || 'guest';
    const role = user?.role || 'guest';

    // 网络信息（IP+User-Agent）
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || null;

    // 控制台彩色输出（按请求方法/状态码区分颜色）
    const timeStr = chalk.gray(`[${new Date().toLocaleTimeString()}]`);
    const methodColor = { GET: chalk.blueBright, POST: chalk.greenBright, PUT: chalk.yellowBright, DELETE: chalk.redBright, PATCH: chalk.magentaBright }[method] || chalk.white;
    const statusColorFn = status >= 500 ? chalk.red : status >= 400 ? chalk.yellow : status >= 300 ? chalk.cyan : status >= 200 ? chalk.green : chalk.white;

    const consoleMsg = `${timeStr} ${methodColor(method)} ${chalk.white(originalUrl)} ${statusColorFn(String(status))} ${chalk.gray(`${duration}ms`)} ${chalk.cyan(`IP:${ip}`)} ${chalk.white(`User:${studentId}`)} ${chalk.gray(`Role:${role}`)}`;
    console.log(consoleMsg);

    // 写入本地日志文件
    logger.info(`${method} ${originalUrl} ${status} ${duration}ms ip=${ip} user=${studentId} role=${role}`);

    // 异步写入operation_logs表（字段严格匹配表定义）
    try {
      const sql = `INSERT INTO operation_logs (user_id, action, target_table, target_id, description, ip_address, user_agent, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`;
      const target_table = extractTableName(originalUrl);
      const description = `Status=${status}, Duration=${duration}ms, Path=${originalUrl}`;
      query(sql, [studentId, method, target_table, null, description, ip, userAgent]).catch(err => {
        logger.error('💥 写入 operation_logs 失败: ' + err.message);
      });
    } catch (err: any) {
      logger.error('logMiddleware DB insert error: ' + err.message);
    }

    // 性能指标统计（按method+url分组）
    const key = `${method} ${originalUrl}`;
    const stat = metrics.get(key);
    if (!stat) metrics.set(key, { count: 1, totalTime: duration });
    else { stat.count += 1; stat.totalTime += duration; }
  });

  next();
};

/** 从URL提取资源名（如/api/users/123提取users，/api/auth/login提取auth） */
function extractTableName(url: string): string | null {
  const parts = url.split('/').filter(Boolean);
  return parts.length >= 2 ? parts[1].replace(/[^a-zA-Z0-9_]/g, '') : null;
}