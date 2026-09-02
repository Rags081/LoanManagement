import mysql, { Pool, PoolConnection, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { getDatabaseConfig } from './config';

let pool: Pool | null = null;

export const getMySQLPool = (): Pool => {
  if (!pool) {
    const config = getDatabaseConfig().mysql;

    pool = mysql.createPool({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database,
      waitForConnections: true,
      connectionLimit: config.maxPool,
      maxIdle: config.minPool,
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

export const getMySQLDb = async (): Promise<PoolConnection> => {
  const currentPool = getMySQLPool();
  return await currentPool.getConnection();
};

export const closeMySQLDb = async (): Promise<void> => {
  if (pool) {
    await pool.end();
    pool = null;
  }
};

export const queryMySQL = async <T extends RowDataPacket[] | RowDataPacket[][]>(
  sql: string,
  params?: unknown[]
): Promise<T> => {
  const currentPool = getMySQLPool();
  const [rows] = await currentPool.query<T>(sql, params);
  return rows;
};

export const executeMySQL = async (
  sql: string,
  params?: unknown[]
): Promise<ResultSetHeader> => {
  const currentPool = getMySQLPool();
  const [result] = await currentPool.execute<ResultSetHeader>(sql, params);
  return result;
};

export const withMySQLTransaction = async <T>(
  callback: (connection: PoolConnection) => Promise<T>
): Promise<T> => {
  const connection = await getMySQLDb();
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
  getMySQLPool,
  getMySQLDb,
  closeMySQLDb,
  queryMySQL,
  executeMySQL,
  withMySQLTransaction,
};
