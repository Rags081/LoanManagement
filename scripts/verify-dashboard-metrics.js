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

async function verifyDashboard() {
  const conn = await mysql.createConnection(DB_CONFIG);
  try {
    const { dashboardRepository } = await import('../netlify/functions/_lib/repositories/dashboard.repository.ts');
    const { loanRepository } = await import('../netlify/functions/_lib/repositories/loan.repository.ts');

    const metrics = await dashboardRepository.getAllMetrics(conn);

    console.log('================================================================');
    console.log('                 DASHBOARD METRICS VERIFICATION');
    console.log('================================================================\n');

    console.log('1. CAPITAL & AVAILABLE CASH:');
    console.log(`   - Total Capital Invested:  ₹${metrics.capital.totalGiven.toFixed(2)}`);
    console.log(`   - Capital Withdrawn:       ₹${metrics.capital.totalReturned.toFixed(2)}`);
    console.log(`   - Net Capital Invested:    ₹${metrics.capital.currentBalance.toFixed(2)}`);
    console.log(`   - Available Cash to Lend:  ₹${metrics.capital.unallocated.toFixed(2)}`);

    console.log('\n2. LOAN STATUS & DISTRIBUTION:');
    console.log(`   - Total Money Given:       ₹${metrics.loans.totalLent.toFixed(2)}`);
    console.log(`   - Running Loans:           ${metrics.loans.activeLoans}`);
    console.log(`   - Overdue Loans:           ${metrics.loans.overdueLoans}`);
    console.log(`   - Fully Closed Loans:      ${metrics.loans.completedLoans}`);
    console.log(`   - Partially Repaid Loans:  ${metrics.loans.partiallyPaidLoans}`);

    console.log('\n3. MONEY COLLECTED:');
    console.log(`   - Total Collected:         ₹${metrics.collections.totalAmountReceived.toFixed(2)}`);
    console.log(`   - Principal Collected:     ₹${metrics.collections.totalPrincipalReceived.toFixed(2)}`);
    console.log(`   - Interest Collected:      ₹${metrics.collections.totalInterestReceived.toFixed(2)}`);
    console.log(`   - Principal Outstanding:   ₹${metrics.collections.outstandingPrincipal.toFixed(2)}`);
    console.log(`   - Interest Outstanding:    ₹${metrics.collections.outstandingInterest.toFixed(2)}`);
    console.log(`   - Total Pending to Collect:₹${metrics.collections.totalOutstanding.toFixed(2)}`);

    console.log('\n4. INTEREST EARNINGS & PROFIT:');
    console.log(`   - Total Expected Interest: ₹${metrics.profit.expectedInterest.toFixed(2)}`);
    console.log(`   - Interest Profit Earned:  ₹${metrics.profit.realizedInterest.toFixed(2)}`);
    console.log(`   - Interest Left to Collect:₹${metrics.profit.pendingInterest.toFixed(2)}`);

    console.log('\n================================================================');
    console.log('                INDIVIDUAL LOAN BREAKDOWN');
    console.log('================================================================');
    const [loans] = await conn.query('SELECT id, loan_id, principal_amount, interest_rate, interest_rate_type, status FROM loans WHERE deleted_at IS NULL ORDER BY id ASC');
    for (const l of loans) {
      const calc = await loanRepository.calculateOutstanding(l.id, conn);
      console.log(`\nLoan ${l.loan_id} [${l.interest_rate_type}, ${l.status}]:`);
      console.log(`  Disbursed Principal:    ₹${calc.principalAmount}`);
      console.log(`  Principal Received:     ₹${calc.principalReceived}`);
      console.log(`  Principal Outstanding:  ₹${calc.principalOutstanding}`);
      console.log(`  Interest Expected:      ₹${calc.interestExpected}`);
      console.log(`  Interest Received:      ₹${calc.interestReceived}`);
      console.log(`  Interest Outstanding:   ₹${calc.interestOutstanding}`);
      console.log(`  Total Outstanding:      ₹${calc.totalOutstanding}`);
      console.log(`  Elapsed Tenure:         ${calc.elapsedTenure}`);
    }

  } finally {
    await conn.end();
  }
}

verifyDashboard().catch(console.error);
