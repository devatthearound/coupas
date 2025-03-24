import { Pool } from 'pg';

const dbConfig = {
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DATABASE,
  password: process.env.POSTGRES_PASSWORD,
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  ssl: false
};

const pool = new Pool(dbConfig);

pool.on('error', (err) => {
  console.error('DB 풀 에러:', err);
});

pool.on('connect', () => {
  console.log('DB 풀에 새로운 클라이언트 연결됨');
});

export default pool; 