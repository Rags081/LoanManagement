import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'loan_management',
};

async function verifyReportReconciliation() {
  const conn = await mysql.createConnection(DB_CONFIG);
  try {
    const { reportRepository } = await import('../netlify/functions/_lib/repositories/report.repository.ts');
    const { dashboardRepository } = await import('../netlify/functions/_lib/repositories/dashboard.repository.ts');

    const dMetrics = await dashboardRepository.getAllMetrics(conn);
    const loanReports = await reportRepository.getLoanReport({}, conn);
    const interestReports = await reportRepository.getInterestReport({}, conn);

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

    console.log('--- DASHBOARD vs REPORT RECONCILIATION ---');
    console.log(`Principal Lent:        Dashboard: ₹${dMetrics.loans.totalLent}, Reports: ₹${reportPrincLent}`);
    console.log(`Principal Received:    Dashboard: ₹${dMetrics.collections.totalPrincipalReceived}, Reports: ₹${reportPrincRec}`);
    console.log(`Principal Outstanding: Dashboard: ₹${dMetrics.collections.outstandingPrincipal}, Reports: ₹${reportPrincOut}`);
    console.log(`Interest Expected:     Dashboard: ₹${dMetrics.profit.expectedInterest}, Reports: ₹${reportExpInt}`);
    console.log(`Interest Received:     Dashboard: ₹${dMetrics.collections.totalInterestReceived}, Reports: ₹${reportIntRec}`);
    console.log(`Interest Outstanding:  Dashboard: ₹${dMetrics.collections.outstandingInterest}, Reports: ₹${reportIntOut}`);
    console.log(`Total Pending:         Dashboard: ₹${dMetrics.collections.totalOutstanding}, Reports: ₹${reportTotalOut}`);

  } finally {
    await conn.end();
  }
}

verifyReportReconciliation().catch(console.error);
