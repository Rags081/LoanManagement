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

async function verifyAllLoansOutstanding() {
  const conn = await mysql.createConnection(DB_CONFIG);
  try {
    const { loanRepository } = await import('../netlify/functions/_lib/repositories/loan.repository.ts');

    const [loans] = await conn.query('SELECT id, loan_id, interest_rate_type, principal_amount, status FROM loans WHERE deleted_at IS NULL ORDER BY id ASC');

    console.log(`=== CALCULATE OUTSTANDING FOR ALL ${loans.length} LOANS ===\n`);

    for (const l of loans) {
      const out = await loanRepository.calculateOutstanding(l.id, conn);
      console.log(`Loan ID: ${l.loan_id} [Type: ${l.interest_rate_type}, Status: ${l.status}]`);
      console.log(`  Principal Amount:      ₹${out.principalAmount}`);
      console.log(`  Principal Received:    ₹${out.principalReceived}`);
      console.log(`  Principal Outstanding: ₹${out.principalOutstanding}`);
      console.log(`  Interest Expected:     ₹${out.interestExpected}`);
      console.log(`  Interest Received:     ₹${out.interestReceived}`);
      console.log(`  Interest Outstanding:  ₹${out.interestOutstanding}`);
      console.log(`  Total Received:        ₹${out.totalReceived}`);
      console.log(`  Total Outstanding:     ₹${out.totalOutstanding}`);
      console.log(`  Elapsed Tenure:        ${out.elapsedTenure} (${out.elapsedDays} days)`);
      console.log(`  Is Overdue:            ${out.isOverdue}`);
      console.log('----------------------------------------------------');
    }
  } finally {
    await conn.end();
  }
}

verifyAllLoansOutstanding().catch(console.error);
