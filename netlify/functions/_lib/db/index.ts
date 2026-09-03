import { getDbDriver, getDatabaseConfig } from './config';
import { getMySQLPool, getMySQLDb, closeMySQLDb, queryMySQL, executeMySQL, withMySQLTransaction } from './mysql';
import { getMongoClient, getMongoDb, closeMongoDb, withMongoSession, MONGO_COLLECTIONS, ensureMongoIndexes } from './mongodb';
import { HealthStatus } from './types';

export * from './types';
export * from './config';
export * from './mysql';
export * from './mongodb';

function classifyDbError(rawMsg: string): string {
  const lower = rawMsg.toLowerCase();
  if (lower.includes('timeout') || lower.includes('timed out') || lower.includes('serverselectionerror')) {
    return 'connection_timeout';
  }
  if (lower.includes('auth') || lower.includes('access denied') || lower.includes('authentication failed')) {
    return 'authentication_failed';
  }
  if (lower.includes('econnrefused') || lower.includes('unreachable') || lower.includes('enotfound')) {
    return 'connection_refused';
  }
  if (lower.includes('querysrv')) {
    return 'dns_resolution_failed';
  }
  return 'database_unreachable';
}

function sanitizeDbError(err: unknown): string {
  if (!err) return 'Unknown database error';
  const rawMsg = err instanceof Error ? err.message : String(err);
  return rawMsg
    .replace(/\/\/[^:]+:[^@]+@/g, '//[masked-credentials]@')
    .replace(/password=[^;&\s]+/gi, 'password=***')
    .replace(/mongodb(\+srv)?:\/\/[^\s]+/gi, 'mongodb://[masked]');
}

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
    const rawMsg = err instanceof Error ? err.message : String(err);
    const message = sanitizeDbError(err);
    const errorType = classifyDbError(rawMsg);

    return {
      status: 'error',
      driver,
      database: 'unreachable',
      errorType,
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
