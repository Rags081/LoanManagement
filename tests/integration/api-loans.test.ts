import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mysql, { Connection, PoolConnection } from 'mysql2/promise';
import { loanRepository } from '../../netlify/functions/_lib/repositories/loan.repository';

describe('Loans Integration Tests', () => {
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

  it('should list all loans with calculated ledger fields', async () => {
    const res = await loanRepository.findAll({ page: 1, limit: 10 }, conn as unknown as PoolConnection);
    expect(res).toBeDefined();
    expect(res.total).toBe(7);
    expect(res.data.length).toBe(7);

    for (const loan of res.data) {
      expect(loan).toHaveProperty('loanId');
      expect(loan).toHaveProperty('principalAmount');
      expect(loan).toHaveProperty('interestRate');
      expect(loan).toHaveProperty('principalReceived');
      expect(loan).toHaveProperty('interestReceived');
      expect(loan).toHaveProperty('totalOutstanding');
    }
  });

  it('should verify LN-010 calculation matches expected values', async () => {
    const loan = await loanRepository.findByLoanId('LN-010', conn as unknown as PoolConnection);
    expect(loan).not.toBeNull();
    expect(loan?.loanId).toBe('LN-010');
    expect(loan?.principalAmount).toBe(10000);
    expect(loan?.interestRate).toBe(10);
    expect(loan?.interestRateType).toBe('monthly');
    expect(loan?.status).toBe('overdue');

    const out0902 = await loanRepository.calculateOutstanding(loan!.id, conn as unknown as PoolConnection, new Date('2026-09-02T12:00:00'));
    expect(out0902.principalOutstanding).toBe(10000);
    expect(out0902.interestExpected).toBe(1966.67);
    expect(out0902.interestOutstanding).toBe(1966.67);
    expect(out0902.totalOutstanding).toBe(11966.67);
    expect(out0902.isOverdue).toBe(true);

    const out0903 = await loanRepository.calculateOutstanding(loan!.id, conn as unknown as PoolConnection, new Date('2026-09-03T12:00:00'));
    expect(out0903.principalOutstanding).toBe(10000);
    expect(out0903.interestExpected).toBe(2000.0);
    expect(out0903.interestOutstanding).toBe(2000.0);
    expect(out0903.totalOutstanding).toBe(12000.0);
    expect(out0903.isOverdue).toBe(true);
  });

  it('should verify LN-002 calculation matches expected values', async () => {
    const loan = await loanRepository.findByLoanId('LN-002', conn as unknown as PoolConnection);
    expect(loan).not.toBeNull();
    expect(loan?.loanId).toBe('LN-002');
    expect(loan?.principalAmount).toBe(10000);

    const out = await loanRepository.calculateOutstanding(loan!.id, conn as unknown as PoolConnection);
    expect(out.principalReceived).toBe(5000);
    expect(out.principalOutstanding).toBe(5000);
    expect(out.interestReceived).toBe(300);
    expect(out.interestOutstanding).toBe(0);
    expect(out.totalOutstanding).toBe(5000);
  });
});
