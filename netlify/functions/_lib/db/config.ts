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
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'loan_management',
      minPool: parseInt(process.env.DB_POOL_MIN || '2', 10),
      maxPool: parseInt(process.env.DB_POOL_MAX || '10', 10),
    },
    mongodb: {
      uri: process.env.MONGODB_URI || 'mongodb://localhost:27017',
      database: process.env.MONGODB_DATABASE || process.env.DB_NAME || 'loan_management',
      maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE || '10', 10),
      minPoolSize: parseInt(process.env.MONGODB_MIN_POOL_SIZE || '2', 10),
    },
  };
}
