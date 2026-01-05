import { Request, Response, NextFunction } from 'express';
import chalk from 'chalk';
import logger from '../utils/logger';
import { query } from '../db';

interface LogItem {
  user_id: string;
  action: string;
  target_table: string | null;
  target_id: string | null;
  description: string;
  ip_address: string;
  user_agent: string | null;
}

// ==================== 配置（全量环境变量控制）===================
const LOG_DB_FOR_GET = process.env.LOG_DB_FOR_GET === 'true';
const SUCCESS_GET_SAMPLE_RATE = Number(process.env.SUCCESS_GET_SAMPLE_RATE) || 0.01;
const LOG_BATCH_SIZE = Number(process.env.LOG_BATCH_SIZE) || 80;
const LOG_FLUSH_INTERVAL_MS = Number(process.env.LOG_FLUSH_INTERVAL_MS) || 3000;
const COLORFUL_CONSOLE = process.env.COLORFUL_CONSOLE !== 'false';

// ==================== 内存缓冲队列 + 防丢刷盘 ===================
let logBuffer: LogItem[] = [];
let flushing = false;

const enqueue = (item: LogItem) => {
  logBuffer.push(item);
  if (logBuffer.length >= LOG_BATCH_SIZE) {
    void flush(); // 不 await，不阻塞请求线程
  }
};

const flush = async () => {
  if (flushing || logBuffer.length === 0) return;
  flushing = true;
  const batch = logBuffer;
  logBuffer = [];

  const values = batch.map(item => [
    item.user_id || 'guest',
    item.action,
    item.target_table || null,
    item.target_id || null,
    item.description.slice(0, 500),
    item.ip_address.slice(0, 45),
    item.user_agent ? item.user_agent.slice(0, 200) : null,
    new Date(),
  ]);

  try {
    await query(
      `INSERT INTO operation_logs 
       (user_id, action, target_table, target_id, description, ip_address, user_agent, created_at) 
       VALUES ?`,
      [values]
    );
  } catch (err: any) {
    logger.error(`日志批量写入失败（稍后自动重试）: ${err.message}`);
    logBuffer = batch.concat(logBuffer).slice(0, LOG_BATCH_SIZE * 15); // 失败重试，防内存爆
  } finally {
    flushing = false;
  }
};

setInterval(() => void flush(), LOG_FLUSH_INTERVAL_MS);

// 进程退出时尽量刷完日志
const graceful = async () => {
  logger.info('正在关闭服务，等待日志写入完成...');
  await flush();
  process.exit(0);
};
process.on('SIGINT', graceful);
process.on('SIGTERM', graceful);

// ==================== 性能统计（5分钟一轮，清零防泄漏）===================
type Metrics = { count: number; total: number };
const metrics = new Map<string, Metrics>();

setInterval(() => {
  if (metrics.size === 0) return;
  const lines = [...metrics.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 30)
    .map(([path, m]) => `${path} → ${m.count}次, 平均 ${(m.total / m.count).toFixed(1)}ms`);
  logger.info(`API 性能 Top30（5分钟）:\n${lines.join('\n')}`);
  metrics.clear();
}, 5 * 60 * 1000);

// ==================== 工具函数 ===================
const getIp = (req: Request): string => {
  return (
    (req.headers['cf-connecting-ip'] as string) ||
    (req.headers['x-real-ip'] as string) ||
    (typeof req.headers['x-forwarded-for'] === 'string'
      ? req.headers['x-forwarded-for'].split(',')[0].trim()
      : '') ||
    req.socket.remoteAddress ||
    'unknown'
  );
};

const getTableName = (req: Request): string | null => {
  try {
    // 1. 优先使用 req.baseUrl
    let base = req.baseUrl || '';
    if (!base) return null;

    // 去掉开头的 /api
    base = base.replace(/^\/api\/?/, '');

    // 2. 处理 /public 开头的特殊情况
    if (base.startsWith('public/')) {
      base = base.slice(7);  // 去掉 public/
      if (!base) return null;
    }

    // 3. 取第一个资源名
    const resource = base.split('/')[0];
    if (!resource) return null;

    // 4. 特殊映射（只处理你真实需要的冲突情况）
    const SPECIAL_MAP: Record<string, string> = {
      'auth': 'auth',
      'email': 'email',
      'recruitment-seasons': 'recruitment-seasons',
      'team-recruitment': 'team-recruitment',
      'announcements': 'announcements',
      'departments': 'departments',
      'team-terms': 'team-terms',
      'backbone-members': 'backbone-members',
      'activities': 'activities',
      'honor-records': 'honor-records',
      'gallery-photos': 'gallery-photos',
      'team-milestones': 'team-milestones',
      'operation-logs': 'operation-logs',
      'oss': 'oss',
    };

    return SPECIAL_MAP[resource] || resource || null;
  } catch {
    return null;
  }
};

const getIdFromUrl = (url: string): string | null => url.match(/\/(\d+)(?:\/|$|\?)/)?.[1] || null;

const colorPrint = (method: string, url: string, status: number, duration: number, extra: string) => {
  if (!COLORFUL_CONSOLE) {
    console.log(`[${new Date().toLocaleTimeString()}] ${method.padEnd(7)} ${url} ${status} ${duration}ms ${extra}`);
    return;
  }
  const mc = { GET: chalk.blueBright, POST: chalk.greenBright, PUT: chalk.yellowBright, DELETE: chalk.redBright }[method] || chalk.white;
  const sc = status >= 500 ? chalk.red : status >= 400 ? chalk.yellow : status >= 300 ? chalk.cyan : chalk.green;
  const dc = duration > 1000 ? chalk.red : duration > 500 ? chalk.yellow : chalk.gray;
  console.log(`${chalk.gray(new Date().toLocaleTimeString())} ${mc(method.padEnd(7))} ${url} ${sc(status)} ${dc(duration + 'ms')} ${chalk.dim(extra)}`);
};

// ==================== 主中间件（零侵入版）===================
export const logMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  // 去掉查询参数的干净路径，用于统计
  const cleanPath = req.route
    ? `${req.baseUrl}${typeof req.route.path === 'string' ? req.route.path : ''}`
    : req.originalUrl.split('?')[0];
  const metricsKey = `${req.method} ${cleanPath}`;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const { method, originalUrl } = req;
    const status = res.statusCode;

    // 核心降噪：成功 GET 采样
    const isNormalGet = method === 'GET' && status >= 200 && status < 400;
    if (isNormalGet && !LOG_DB_FOR_GET && Math.random() > SUCCESS_GET_SAMPLE_RATE) {
      // 只记性能统计
      const m = metrics.get(metricsKey) || { count: 0, total: 0 };
      m.count += 1;
      m.total += duration;
      metrics.set(metricsKey, m);
      return;
    }

    const user = (req as any).user || {};
    const userId = user?.student_id || user?.user_id || 'guest';
    const role = user?.role || 'guest';
    const ip = getIp(req);
    const ua = (req.headers['user-agent'] as string) || null;

    // 控制台 + 文件日志（永远记录）
    colorPrint(method, originalUrl, status, duration, `${userId}(${role}) ${ip}`);
    logger.info(`${method} ${originalUrl} ${status} ${duration}ms | ${userId}(${role}) ${ip}`);

    // 数据库审计日志（关键优化）
    const needDbLog = LOG_DB_FOR_GET || method !== 'GET' || status >= 400;
    if (needDbLog) {
      enqueue({
        user_id: userId,
        action: method,
        target_table: getTableName(req),
        target_id: getIdFromUrl(originalUrl),
        description: `${status} ${duration}ms ${originalUrl}`,
        ip_address: ip,
        user_agent: ua,
      });
    }

    // 性能统计
    const m = metrics.get(metricsKey) || { count: 0, total: 0 };
    m.count += 1;
    m.total += duration;
    metrics.set(metricsKey, m);
  });

  next();
};