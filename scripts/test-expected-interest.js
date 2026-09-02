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

async function testExpectedInterest() {
  const conn = await mysql.createConnection(DB_CONFIG);
  try {
    const { loanRepository } = await import('../netlify/functions/_lib/repositories/loan.repository.ts');

    const [loans] = await conn.query('SELECT id, loan_id FROM loans WHERE deleted_at IS NULL ORDER BY id ASC');
    let sumExpected = 0;
    let sumReceived = 0;

    console.log('--- INDIVIDUAL LOAN OUTSTANDING DATA ---');
    for (const l of loans) {
      const out = await loanRepository.calculateOutstanding(l.id, conn);
      console.log(`Loan ${l.loan_id}: interestExpected = ₹${out.interestExpected}, accruedInterest = ₹${out.accruedInterest}, interestReceived = ₹${out.interestReceived}, interestOutstanding = ₹${out.interestOutstanding}`);
      sumExpected += out.interestExpected;
      sumReceived += out.interestReceived;
    }

    console.log(`\nSUM Expected Interest: ₹${sumExpected}`);
    console.log(`SUM Interest Received: ₹${sumReceived}`);
    console.log(`SUM Interest Outstanding: ₹${sumExpected - sumReceived}`);
  } finally {
    await conn.end();
  }
}

testExpectedInterest().catch(console.error);
