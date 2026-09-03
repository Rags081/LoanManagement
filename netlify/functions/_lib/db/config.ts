import dotenv from 'dotenv';
import { DatabaseConfig, DbDriver } from './types';

dotenv.config();

export function getDbDriver(): DbDriver {
  const driver = (process.env.DB_DRIVER || 'mysql').toLowerCase().trim();
  if (driver === 'mongodb' || driver === 'mongo') {
    return 'mongodb';
  }
  return 'mysql';
}

export function getDatabaseConfig(): DatabaseConfig {
  const driver = getDbDriver();

  return {
    driver,
    mysql: {
      host: process.env.DB_HOST || '127.0.0.1',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'app_db',
      minPool: parseInt(process.env.DB_POOL_MIN || '2', 10),
      maxPool: parseInt(process.env.DB_POOL_MAX || '10', 10),
    },
    mongodb: {
      uri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017',
      database: process.env.MONGODB_DATABASE || process.env.DB_NAME || 'app_db',
      maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE || '10', 10),
      minPoolSize: parseInt(process.env.MONGODB_MIN_POOL_SIZE || '2', 10),
    },
  };
}
