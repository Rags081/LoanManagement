import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mysql, { Connection, PoolConnection } from 'mysql2/promise';
import { loanRepository } from '../../netlify/functions/_lib/repositories/loan.repository';

describe('Financial Calculation Characterization Tests', () => {
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

  it('LN-010 characterization as of 2026-09-02: 1 month + 29 days (₹1966.67)', async () => {
    const loan = await loanRepository.findByLoanId('LN-010', conn as unknown as PoolConnection);
    expect(loan).not.toBeNull();
    const out = await loanRepository.calculateOutstanding(loan!.id, conn as unknown as PoolConnection, new Date('2026-09-02T12:00:00'));

    expect(out.principalOutstanding).toBe(10000);
    expect(out.interestExpected).toBe(1966.67);
    expect(out.interestOutstanding).toBe(1966.67);
    expect(out.totalOutstanding).toBe(11966.67);
    expect(out.elapsedTenure).toBe('1 month 29 days');
    expect(out.isOverdue).toBe(true);
  });

  it('LN-010 characterization as of 2026-09-03: 1 month + 30 days (+₹33.33 daily pro-rata = ₹2000.00)', async () => {
    const loan = await loanRepository.findByLoanId('LN-010', conn as unknown as PoolConnection);
    expect(loan).not.toBeNull();
    const out = await loanRepository.calculateOutstanding(loan!.id, conn as unknown as PoolConnection, new Date('2026-09-03T12:00:00'));

    expect(out.principalOutstanding).toBe(10000);
    expect(out.interestExpected).toBe(2000.0);
    expect(out.interestOutstanding).toBe(2000.0);
    expect(out.totalOutstanding).toBe(12000.0);
    expect(out.elapsedTenure).toBe('1 month 30 days');
    expect(out.isOverdue).toBe(true);
  });

  it('LN-002 characterization: monthly active 3% loan with payments', async () => {
    const loan = await loanRepository.findByLoanId('LN-002', conn as unknown as PoolConnection);
    expect(loan).not.toBeNull();
    const out = await loanRepository.calculateOutstanding(loan!.id, conn as unknown as PoolConnection);

    expect(out.principalReceived).toBe(5000);
    expect(out.principalOutstanding).toBe(5000);
    expect(out.interestReceived).toBe(300);
    expect(out.interestOutstanding).toBe(0);
    expect(out.totalOutstanding).toBe(5000);
  });

  it('LN-005 characterization: flat active 5% loan', async () => {
    const loan = await loanRepository.findByLoanId('LN-005', conn as unknown as PoolConnection);
    expect(loan).not.toBeNull();
    const out = await loanRepository.calculateOutstanding(loan!.id, conn as unknown as PoolConnection);

    expect(out.principalOutstanding).toBe(5000);
    expect(out.interestExpected).toBe(250);
    expect(out.interestOutstanding).toBe(250);
    expect(out.totalOutstanding).toBe(5250);
  });

  it('LN-008 characterization: flat completed 10% loan', async () => {
    const loan = await loanRepository.findByLoanId('LN-008', conn as unknown as PoolConnection);
    expect(loan).not.toBeNull();
    const out = await loanRepository.calculateOutstanding(loan!.id, conn as unknown as PoolConnection);

    expect(out.principalReceived).toBe(5000);
    expect(out.principalOutstanding).toBe(0);
    expect(out.interestReceived).toBe(500);
    expect(out.interestOutstanding).toBe(0);
    expect(out.totalOutstanding).toBe(0);
    expect(out.isCompleted).toBe(true);
  });
});
