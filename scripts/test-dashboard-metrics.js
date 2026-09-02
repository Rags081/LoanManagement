import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { dashboardRepository } from '../netlify/functions/_lib/repositories/dashboard.repository.js';
import { loanRepository } from '../netlify/functions/_lib/repositories/loan.repository.js';

dotenv.config();

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'loan_management',
};

async function testDashboardMetrics() {
  console.log('🧪 Testing Dashboard Metrics Calculation...\n');
  const conn = await mysql.createConnection(DB_CONFIG);

  try {
    const metrics = await dashboardRepository.getAllMetrics(conn);
    console.log('=== Capital Metrics ===', metrics.capital);
    console.log('=== Loan Metrics ===', metrics.loans);
    console.log('=== Collection Metrics ===', metrics.collections);
    console.log('=== Profit Metrics ===', metrics.profit);

    // Verify non-settled loans match CollectionMetrics.totalOutstanding
    const [activeLoans] = await conn.query(
      `SELECT id, loan_id, status FROM loans WHERE status IN ('active', 'overdue') AND deleted_at IS NULL`
    );

    let calculatedSum = 0;
    for (const l of activeLoans) {
      const calc = await loanRepository.calculateOutstanding(l.id, conn);
      console.log(`Loan ${l.loan_id} (${l.status}): Principal Outstanding = ₹${calc.principalOutstanding}, Interest Outstanding = ₹${calc.interestOutstanding}, Total Outstanding = ₹${calc.totalOutstanding}`);
      calculatedSum += calc.totalOutstanding;
    }

    console.log(`\nDirect Calculated Sum of Non-Settled Loans: ₹${calculatedSum}`);
    console.log(`Dashboard Collection Metrics totalOutstanding: ₹${metrics.collections.totalOutstanding}`);

    if (metrics.collections.totalOutstanding !== calculatedSum) {
      throw new Error(`Mismatch! Expected ${calculatedSum}, got ${metrics.collections.totalOutstanding}`);
    }

    console.log('\n✔ Verification passed: Dashboard Total Pending to Collect is 100% consistent with canonical loan outstanding calculations!');

  } finally {
    await conn.end();
  }
}

testDashboardMetrics().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
