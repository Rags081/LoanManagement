import mysql, { Pool, PoolConnection, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

let pool: Pool | null = null;

export const getPool = (): Pool => {
  if (!pool) {
    const minPool = parseInt(process.env.DB_POOL_MIN || '2', 10);
    const maxPool = parseInt(process.env.DB_POOL_MAX || '10', 10);

    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'loan_management',
      waitForConnections: true,
      connectionLimit: maxPool,
      maxIdle: minPool,
      idleTimeout: 60000,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
      decimalNumbers: true,
      dateStrings: true,
    });
  }
  return pool;
};

/**
 * Get a connection from the pool
 */
export const getDb = async (): Promise<PoolConnection> => {
  const currentPool = getPool();
  return await currentPool.getConnection();
};

/**
 * Gracefully close the database pool
 */
export const closeDb = async (): Promise<void> => {
  if (pool) {
    await pool.end();
    pool = null;
  }
};

/**
 * Direct query helper returning typed rows
 */
export const query = async <T extends RowDataPacket[] | RowDataPacket[][]>(
  sql: string,
  params?: unknown[]
): Promise<T> => {
  const currentPool = getPool();
  const [rows] = await currentPool.query<T>(sql, params);
  return rows;
};

/**
 * Direct execute helper for INSERT/UPDATE/DELETE returning ResultSetHeader
 */
export const execute = async (
  sql: string,
  params?: unknown[]
): Promise<ResultSetHeader> => {
  const currentPool = getPool();
  const [result] = await currentPool.execute<ResultSetHeader>(sql, params);
  return result;
};

/**
 * Helper to run a callback inside a managed database transaction
 */
export const withTransaction = async <T>(
  callback: (connection: PoolConnection) => Promise<T>
): Promise<T> => {
  const connection = await getDb();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export default {
  getPool,
  getDb,
  closeDb,
  query,
  execute,
  withTransaction,
};
