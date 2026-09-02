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

async function checkLoan15() {
  const conn = await mysql.createConnection(DB_CONFIG);
  try {
    const [loans] = await conn.query('SELECT * FROM loans');
    console.table(loans.map(l => ({
      id: l.id,
      loan_id: l.loan_id,
      status: l.status,
      principal: l.principal_amount,
      rate: l.interest_rate,
      rate_type: l.interest_rate_type,
      expected_interest: l.total_expected_interest,
      tenure: l.tenure_duration,
      tenure_unit: l.tenure_unit
    })));
  } finally {
    await conn.end();
  }
}

checkLoan15().catch(console.error);
