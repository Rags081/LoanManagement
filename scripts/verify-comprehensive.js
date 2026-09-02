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

async function runComprehensiveVerification() {
  const conn = await mysql.createConnection(DB_CONFIG);
  try {
    const { loanRepository } = await import('../netlify/functions/_lib/repositories/loan.repository.ts');
    const { dashboardRepository } = await import('../netlify/functions/_lib/repositories/dashboard.repository.ts');
    const { reportRepository } = await import('../netlify/functions/_lib/repositories/report.repository.ts');

    console.log('=== 1. VERIFY LN-010 VALUES IN DATABASE ===');
    const [ln010Rows] = await conn.query('SELECT * FROM loans WHERE loan_id = "LN-010" AND deleted_at IS NULL');
    const ln010 = ln010Rows[0];
    console.log({
      loan_id: ln010.loan_id,
      principal_amount: ln010.principal_amount,
      interest_rate: ln010.interest_rate,
      interest_rate_type: ln010.interest_rate_type,
      total_expected_interest: ln010.total_expected_interest,
      total_expected_repayment: ln010.total_expected_repayment,
      status: ln010.status,
    });

    console.log('\n=== 2. CALCULATE OUTSTANDING FOR ALL ACTIVE / OVERDUE LOANS ===');
    const [activeLoans] = await conn.query(
      `SELECT id, loan_id, status, principal_amount, interest_rate, interest_rate_type 
       FROM loans 
       WHERE status IN ('active', 'overdue') AND deleted_at IS NULL
       ORDER BY id ASC`
    );

    let sumPrincipal = 0;
    let sumInterest = 0;
    let sumTotal = 0;

    for (const l of activeLoans) {
      const calc = await loanRepository.calculateOutstanding(l.id, conn);
      console.log(`Loan ${l.loan_id} [${l.status}]:`, {
        principalOutstanding: `₹${calc.principalOutstanding.toLocaleString('en-IN')}`,
        interestOutstanding: `₹${calc.interestOutstanding.toLocaleString('en-IN')}`,
        totalOutstanding: `₹${calc.totalOutstanding.toLocaleString('en-IN')}`,
      });
      sumPrincipal += calc.principalOutstanding;
      sumInterest += calc.interestOutstanding;
      sumTotal += calc.totalOutstanding;
    }

    console.log('\n=== ACTIVE / OVERDUE SUMS ===');
    console.log(`Sum Principal Outstanding: ₹${sumPrincipal.toLocaleString('en-IN')}`);
    console.log(`Sum Interest Outstanding: ₹${sumInterest.toLocaleString('en-IN')}`);
    console.log(`Total Pending to Collect: ₹${sumTotal.toLocaleString('en-IN')}`);

    console.log('\n=== 3. DASHBOARD METRICS VERIFICATION ===');
    const collectionMetrics = await dashboardRepository.getCollectionMetrics(conn);
    console.log('Dashboard Collection Metrics:', {
      outstandingPrincipal: `₹${collectionMetrics.outstandingPrincipal.toLocaleString('en-IN')}`,
      outstandingInterest: `₹${collectionMetrics.outstandingInterest.toLocaleString('en-IN')}`,
      totalOutstanding: `₹${collectionMetrics.totalOutstanding.toLocaleString('en-IN')}`,
    });

    const profitMetrics = await dashboardRepository.getProfitMetrics(conn);
    console.log('Dashboard Profit Metrics:', {
      expectedInterest: `₹${profitMetrics.expectedInterest.toLocaleString('en-IN')}`,
      realizedInterest: `₹${profitMetrics.realizedInterest.toLocaleString('en-IN')}`,
      pendingInterest: `₹${profitMetrics.pendingInterest.toLocaleString('en-IN')}`,
    });

    console.log('\n=== 4. COMPLETED LOANS EXCLUSION CHECK ===');
    const [completedLoans] = await conn.query(
      `SELECT id, loan_id, status FROM loans WHERE status = 'completed' AND deleted_at IS NULL`
    );
    for (const c of completedLoans) {
      const calc = await loanRepository.calculateOutstanding(c.id, conn);
      console.log(`Completed Loan ${c.loan_id}: Total Outstanding = ₹${calc.totalOutstanding}`);
    }

  } finally {
    await conn.end();
  }
}

runComprehensiveVerification().catch(console.error);
