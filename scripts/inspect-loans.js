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

async function inspectDbLoans() {
  const conn = await mysql.createConnection(DB_CONFIG);
  try {
    const [loans] = await conn.query('SELECT id, loan_id, principal_amount, interest_rate, interest_rate_type, loan_given_date, status, total_expected_interest FROM loans WHERE deleted_at IS NULL ORDER BY id ASC');
    console.log('--- ALL LOANS IN DB ---');
    console.table(loans);
  } finally {
    await conn.end();
  }
}

inspectDbLoans().catch(console.error);
