import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mysql, { Connection, PoolConnection } from 'mysql2/promise';
import { paymentRepository } from '../../netlify/functions/_lib/repositories/payment.repository';

describe('Payments Integration Tests', () => {
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

  it('should list payments with borrower and loan details', async () => {
    const res = await paymentRepository.findAll({ page: 1, limit: 10 }, conn as unknown as PoolConnection);
    expect(res).toBeDefined();
    expect(res.total).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(res.data)).toBe(true);

    if (res.data.length > 0) {
      const p = res.data[0];
      expect(p).toHaveProperty('payment_id');
      expect(p).toHaveProperty('payment_amount');
      expect(p).toHaveProperty('principal_portion');
      expect(p).toHaveProperty('interest_portion');
    }
  });

  it('should calculate total received amounts by loan', async () => {
    const received = await paymentRepository.getTotalReceivedByLoan(2, conn as unknown as PoolConnection);
    expect(received).toBeDefined();
    expect(received.total).toBe(received.principalTotal + received.interestTotal);
  });
});
