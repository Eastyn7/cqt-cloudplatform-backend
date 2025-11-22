import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT) || 10,
  charset: 'utf8mb4',
  multipleStatements: false
});

// 测试连接
export const checkDatabaseConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ 数据库连接成功');
    connection.release();
  } catch (err: any) {
    console.error('❌ 数据库连接失败:', err.message);
    process.exit(1);
  }
};

// 封装通用查询函数
export const query = async <T = any>(sql: string, values?: any): Promise<T> => {
  try {
    if (process.env.ENABLE_SQL_LOG === 'true') console.log('🧩 SQL:', sql);
    const [rows] = await pool.query(sql, values);
    return rows as T;
  } catch (error) {
    console.error('❌ SQL 执行错误:', error);
    throw error;
  }
};

export default pool;