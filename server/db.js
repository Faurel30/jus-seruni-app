import mysql from 'mysql2/promise';
import 'dotenv/config';

// TiDB Cloud requires TLS/SSL connections.
const isTiDB = (process.env.DB_HOST || '').includes('tidbcloud.com');
const sslConfig = (process.env.DB_SSL === 'true' || isTiDB)
  ? { minVersion: 'TLSv1.2', rejectUnauthorized: true }
  : undefined;

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'seruni_user',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'seruni_db',
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
  queueLimit: 0,
  charset: 'utf8mb4',
  dateStrings: true,
  timezone: 'local',
  ssl: sslConfig,
});

export default pool;
