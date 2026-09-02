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

async function debugLn010() {
  const conn = await mysql.createConnection(DB_CONFIG);
  try {
    const { calculateCalendarTenure } = await import('../netlify/functions/_lib/repositories/loan.repository.ts');
    const [rows] = await conn.query('SELECT * FROM loans WHERE loan_id = "LN-010"');
    const loan = rows[0];
    console.log('LN-010 DB row:', {
      loan_id: loan.loan_id,
      loan_given_date: loan.loan_given_date,
      loan_given_date_str: String(loan.loan_given_date instanceof Date ? loan.loan_given_date.toISOString() : loan.loan_given_date),
      today: new Date().toISOString().split('T')[0],
      rate: loan.interest_rate,
      rate_type: loan.interest_rate_type,
    });

    const givenDateStr = String(loan.loan_given_date instanceof Date ? loan.loan_given_date.toISOString() : loan.loan_given_date).split('T')[0];
    const todayStr = new Date().toISOString().split('T')[0];
    const tenure = calculateCalendarTenure(givenDateStr, todayStr);
    console.log('Tenure result for LN-010:', tenure);
  } finally {
    await conn.end();
  }
}

debugLn010().catch(console.error);
