import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getDbDriver, getDatabaseConfig } from '../../netlify/functions/_lib/db/config';
import { checkDatabaseHealth } from '../../netlify/functions/_lib/db/index';

describe('Database Abstraction Layer Unit Tests', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it('should default to mysql driver when DB_DRIVER is unset or empty', () => {
    delete process.env.DB_DRIVER;
    expect(getDbDriver()).toBe('mysql');

    process.env.DB_DRIVER = '';
    expect(getDbDriver()).toBe('mysql');
  });

  it('should resolve mongodb when DB_DRIVER=mongodb or mongo', () => {
    process.env.DB_DRIVER = 'mongodb';
    expect(getDbDriver()).toBe('mongodb');

    process.env.DB_DRIVER = 'MONGODB';
    expect(getDbDriver()).toBe('mongodb');

    process.env.DB_DRIVER = 'mongo';
    expect(getDbDriver()).toBe('mongodb');
  });

  it('should correctly build configuration objects for both drivers', () => {
    process.env.DB_HOST = 'test-mysql-host';
    process.env.DB_PORT = '3309';
    process.env.DB_NAME = 'test_loan_db';
    process.env.MONGODB_URI = 'mongodb+srv://user:pass@cluster.mongodb.net';
    process.env.MONGODB_DATABASE = 'test_mongo_db';

    const config = getDatabaseConfig();
    expect(config.mysql.host).toBe('test-mysql-host');
    expect(config.mysql.port).toBe(3309);
    expect(config.mysql.database).toBe('test_loan_db');
    expect(config.mongodb.uri).toBe('mongodb+srv://user:pass@cluster.mongodb.net');
    expect(config.mongodb.database).toBe('test_mongo_db');
  });

  it('should report database connection health for active driver', async () => {
    process.env.DB_DRIVER = 'mysql';
    const health = await checkDatabaseHealth();
    expect(health.driver).toBe('mysql');
    expect(health.status).toBe('ok');
    expect(health.database).toBe('connected');
    expect(typeof health.uptime).toBe('number');
  });
});
