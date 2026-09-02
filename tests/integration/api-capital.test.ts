import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mysql, { Connection, PoolConnection } from 'mysql2/promise';
import { capitalRepository } from '../../netlify/functions/_lib/repositories/capital.repository';

describe('Capital Integration Tests', () => {
  let conn: Connection;

  beforeAll(async () => {
    conn = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'loan_management',
    });
  });

  afterAll(async () => {
    await conn.end();
  });

  it('should calculate current capital running balance', async () => {
    const runningBalance = await capitalRepository.getCurrentRunningBalance(conn as unknown as PoolConnection);
    expect(typeof runningBalance).toBe('number');
    expect(runningBalance).toBeGreaterThanOrEqual(0);
  });

  it('should list capital transactions with running balances', async () => {
    const result = await capitalRepository.findAll({ limit: 5 }, conn as unknown as PoolConnection);
    expect(result).toBeDefined();
    expect(Array.isArray(result.data)).toBe(true);
    if (result.data.length > 0) {
      expect(result.data[0]).toHaveProperty('running_balance');
      expect(result.data[0]).toHaveProperty('transaction_type');
    }
  });
});
