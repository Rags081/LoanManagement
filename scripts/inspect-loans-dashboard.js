import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { loanRepository } from '../netlify/functions/_lib/repositories/loan.repository.js';

dotenv.config();

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'loan_management',
};

async function inspectLoans() {
  const conn = await mysql.createConnection(DB_CONFIG);
  try {
    const [loans] = await conn.query('SELECT id, loan_id, status, principal_amount, interest_rate, interest_rate_type, loan_given_date, due_date FROM loans WHERE deleted_at IS NULL');
    console.log('All Loans:');
    let totalNonSettledOutstanding = 0;
    let totalNonSettledPrincipal = 0;
    let totalNonSettledInterest = 0;

    for (const l of loans) {
      const calc = await loanRepository.calculateOutstanding(l.id, conn);
      console.log(`Loan #${l.id} (${l.loan_id}) [${l.status}]:`, {
        principalAmount: Number(l.principal_amount),
        principalOutstanding: calc.principalOutstanding,
        interestAccrued: calc.interestAccrued,
        interestOutstanding: calc.interestOutstanding,
        totalOutstanding: calc.totalOutstanding,
      });

      if (l.status !== 'completed' && l.status !== 'settled' && l.status !== 'cancelled') {
        totalNonSettledOutstanding += calc.totalOutstanding;
        totalNonSettledPrincipal += calc.principalOutstanding;
        totalNonSettledInterest += calc.interestOutstanding;
      }
    }

    console.log('\n--- Summary for Non-Settled Loans ---');
    console.log('Total Principal Outstanding:', totalNonSettledPrincipal);
    console.log('Total Interest Outstanding:', totalNonSettledInterest);
    console.log('Total Pending to Collect (Canonical Sum):', totalNonSettledOutstanding);

  } finally {
    await conn.end();
  }
}

inspectLoans().catch(console.error);
