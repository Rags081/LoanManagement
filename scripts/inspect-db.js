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

async function inspect() {
  const conn = await mysql.createConnection(DB_CONFIG);
  try {
    console.log('=== CAPITAL TRANSACTIONS ===');
    const [cap] = await conn.query('SELECT * FROM capital_transactions');
    console.table(cap);

    console.log('\n=== LOANS ===');
    const [loans] = await conn.query('SELECT id, loan_id, borrower_id, principal_amount, interest_rate, interest_rate_type, loan_given_date, due_date, status, settlement_date FROM loans WHERE deleted_at IS NULL');
    console.table(loans);

    console.log('\n=== PAYMENTS ===');
    const [payments] = await conn.query('SELECT id, payment_id, loan_id, payment_date, payment_amount, principal_portion, interest_portion, is_void FROM payments');
    console.table(payments);
  } finally {
    await conn.end();
  }
}

inspect();
