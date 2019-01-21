import { Pool } from 'pg';

const pool = new Pool({
  host: 'localhost',
  user: 'dbuser',
  password: 'password',
  database: 'compup',
  port: 5432,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export const buildConnection = () => pool.connect();
export const releaseConnection = connection => connection.release();
