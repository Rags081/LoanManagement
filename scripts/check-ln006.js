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

async function checkLN006() {
  const conn = await mysql.createConnection(DB_CONFIG);
  try {
    const [loans] = await conn.query('SELECT * FROM loans WHERE loan_id = "LN-006"');
    const [payments] = await conn.query('SELECT * FROM payments WHERE loan_id = ?', [loans[0]?.id]);
    console.log('LN-006:', loans[0]);
    console.log('Payments for LN-006:', payments);
  } finally {
    await conn.end();
  }
}

checkLN006().catch(console.error);
