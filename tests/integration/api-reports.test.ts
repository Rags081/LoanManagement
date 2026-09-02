import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mysql, { Connection, PoolConnection } from 'mysql2/promise';
import { reportRepository } from '../../netlify/functions/_lib/repositories/report.repository';
import { dashboardRepository } from '../../netlify/functions/_lib/repositories/dashboard.repository';

describe('Reports Integration & Reconciliation Tests', () => {
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

  it('should generate capital statement report', async () => {
    const report = await reportRepository.getCapitalStatement({}, conn as unknown as PoolConnection);
    expect(Array.isArray(report)).toBe(true);
  });

  it('should verify report numbers 100% reconcile with dashboard metrics', async () => {
    const dMetrics = await dashboardRepository.getAllMetrics(conn as unknown as PoolConnection);
    const loanReports = await reportRepository.getLoanReport({}, conn as unknown as PoolConnection);
    const interestReports = await reportRepository.getInterestReport({}, conn as unknown as PoolConnection);

    let reportPrincLent = 0;
    let reportPrincRec = 0;
    let reportPrincOut = 0;
    let reportIntRec = 0;
    let reportIntOut = 0;
    let reportTotalOut = 0;

    for (const lr of loanReports) {
      reportPrincLent += lr.principalAmount;
      reportPrincRec += lr.principalReceived;
      reportPrincOut += lr.principalOutstanding;
      reportIntRec += lr.interestReceived;
      reportIntOut += lr.interestOutstanding;
      reportTotalOut += lr.totalOutstanding;
    }

    let reportExpInt = 0;
    for (const ir of interestReports) {
      reportExpInt += ir.expectedInterest;
    }

    expect(reportPrincLent).toBe(dMetrics.loans.totalLent);
    expect(reportPrincRec).toBe(dMetrics.collections.totalPrincipalReceived);
    expect(reportPrincOut).toBe(dMetrics.collections.outstandingPrincipal);
    expect(reportExpInt).toBe(dMetrics.profit.expectedInterest);
    expect(reportIntRec).toBe(dMetrics.collections.totalInterestReceived);
    expect(reportIntOut).toBe(dMetrics.collections.outstandingInterest);
    expect(reportTotalOut).toBe(dMetrics.collections.totalOutstanding);

    // Baseline exact totals verification
    expect(dMetrics.loans.totalLent).toBe(53000);
    expect(dMetrics.collections.totalPrincipalReceived).toBe(27000);
    expect(dMetrics.collections.outstandingPrincipal).toBe(26000);
    expect(dMetrics.profit.expectedInterest).toBe(3216.67);
    expect(dMetrics.collections.totalInterestReceived).toBe(1000);
    expect(dMetrics.collections.outstandingInterest).toBe(2216.67);
    expect(dMetrics.collections.totalOutstanding).toBe(28216.67);
  });
});
