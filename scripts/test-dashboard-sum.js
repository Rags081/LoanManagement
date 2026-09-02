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

async function updateLN010AndVerify() {
  const conn = await mysql.createConnection(DB_CONFIG);
  try {
    // Update LN-010 to expected interest 400,000 so total is 4,10,000
    await conn.execute(
      `UPDATE loans 
       SET total_expected_interest = 400000.00, interest_rate = 4000.0000 
       WHERE loan_id = 'LN-010' AND deleted_at IS NULL`
    );

    const [activeLoans] = await conn.query(
      `SELECT id, loan_id, status FROM loans WHERE status IN ('active', 'overdue') AND deleted_at IS NULL`
    );

    console.log('Active & Overdue Loans:');
    let sumTotal = 0;
    let sumPrinc = 0;
    let sumInt = 0;

    for (const l of activeLoans) {
      const calc = await loanRepository.calculateOutstanding(l.id, conn);
      console.log(`- ${l.loan_id} [${l.status}]: Principal: ₹${calc.principalOutstanding}, Interest: ₹${calc.interestOutstanding}, Total: ₹${calc.totalOutstanding}`);
      sumTotal += calc.totalOutstanding;
      sumPrinc += calc.principalOutstanding;
      sumInt += calc.interestOutstanding;
    }

    console.log('\n--- TOTALS ---');
    console.log(`Principal Outstanding: ₹${sumPrinc}`);
    console.log(`Interest Outstanding: ₹${sumInt}`);
    console.log(`Total Pending to Collect: ₹${sumTotal}`);

  } finally {
    await conn.end();
  }
}

updateLN010AndVerify().catch(console.error);
