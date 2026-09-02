import { getDbDriver, getDatabaseConfig } from './config';
import { getMySQLPool, getMySQLDb, closeMySQLDb, queryMySQL, executeMySQL, withMySQLTransaction } from './mysql';
import { getMongoClient, getMongoDb, closeMongoDb, withMongoSession, MONGO_COLLECTIONS, ensureMongoIndexes } from './mongodb';
import { HealthStatus } from './types';

export * from './types';
export * from './config';
export * from './mysql';
export * from './mongodb';

export async function checkDatabaseHealth(): Promise<HealthStatus> {
  const driver = getDbDriver();
  const uptime = Math.floor(process.uptime());
  const timestamp = new Date().toISOString();

  try {
    if (driver === 'mongodb') {
      const db = await getMongoDb();
      await db.command({ ping: 1 });
      return {
        status: 'ok',
        driver: 'mongodb',
        database: 'connected',
        uptime,
        timestamp,
      };
    } else {
      const pool = getMySQLPool();
      await pool.query('SELECT 1');
      return {
        status: 'ok',
        driver: 'mysql',
        database: 'connected',
        uptime,
        timestamp,
      };
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database connection error';
    return {
      status: 'error',
      driver,
      database: 'error',
      error: message,
      uptime,
      timestamp,
    };
  }
}

export default {
  getDbDriver,
  getDatabaseConfig,
  checkDatabaseHealth,
  // MySQL
  getMySQLPool,
  getMySQLDb,
  closeMySQLDb,
  queryMySQL,
  executeMySQL,
  withMySQLTransaction,
  // MongoDB
  getMongoClient,
  getMongoDb,
  closeMongoDb,
  withMongoSession,
  MONGO_COLLECTIONS,
  ensureMongoIndexes,
};
