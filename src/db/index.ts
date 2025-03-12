import mysql from 'mysql';
import dotenv from 'dotenv';

// 加载 .env 配置
dotenv.config();

// 创建数据库连接池
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

/**
 * 测试数据库连接是否成功
 */
export const checkDatabaseConnection = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.getConnection((err, connection) => {
      if (err) {
        console.error('❌ 数据库连接失败:', err.message);
        process.exit(1); // 退出程序，防止服务器在数据库异常时继续运行
        return reject(err);
      }
      console.log('✅ 数据库连接成功');
      connection.release();
      resolve();
    });
  });
};

// 封装 db.query 为 Promise
export const query = <T>(sql: string, values?: any): Promise<T> => {
  return new Promise((resolve, reject) => {
    db.query(sql, values, (error, results) => {
      if (error) {
        return reject(error);
      }
      resolve(results);
    });
  });
};

export default db;
