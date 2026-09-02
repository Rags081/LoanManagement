import {
  getMySQLPool,
  getMySQLDb,
  closeMySQLDb,
  queryMySQL,
  executeMySQL,
  withMySQLTransaction,
} from './db/mysql';

export const getPool = getMySQLPool;
export const getDb = getMySQLDb;
export const closeDb = closeMySQLDb;
export const query = queryMySQL;
export const execute = executeMySQL;
export const withTransaction = withMySQLTransaction;

export default {
  getPool,
  getDb,
  closeDb,
  query,
  execute,
  withTransaction,
};
