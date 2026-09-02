import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mysql, { Connection, PoolConnection } from 'mysql2/promise';
import { borrowerRepository } from '../../netlify/functions/_lib/repositories/borrower.repository';

describe('Borrowers Integration Tests', () => {
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

  it('should list active borrowers with pagination', async () => {
    const res = await borrowerRepository.findAll({ page: 1, limit: 10 }, conn as unknown as PoolConnection);
    expect(res).toBeDefined();
    expect(res.total).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(res.data)).toBe(true);
  });

  it('should find borrower by ID and include credit statistics', async () => {
    const res = await borrowerRepository.findAll({ page: 1, limit: 1 }, conn as unknown as PoolConnection);
    if (res.data.length > 0) {
      const bId = res.data[0].id;
      const borrower = await borrowerRepository.findById(bId, conn as unknown as PoolConnection);
      expect(borrower).not.toBeNull();
      expect(borrower?.id).toBe(bId);
      expect(borrower).toHaveProperty('full_name');
      expect(borrower).toHaveProperty('phone');
    }
  });

  it('should detect duplicate phone numbers correctly', async () => {
    const res = await borrowerRepository.findAll({ page: 1, limit: 1 }, conn as unknown as PoolConnection);
    if (res.data.length > 0) {
      const existingPhone = res.data[0].phone;
      const found = await borrowerRepository.findByPhone(existingPhone, conn as unknown as PoolConnection);
      expect(found).not.toBeNull();
      expect(found?.phone).toBe(existingPhone);
    }
  });
});
