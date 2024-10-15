import mysql from 'mysql';

const db = mysql.createPool({
  host: '127.0.0.1',
  user: 'root',
  password: 'Hu1282861514',
  database: 'cqt_cloud_platform'
});

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
