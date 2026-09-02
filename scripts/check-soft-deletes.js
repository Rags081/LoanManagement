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

async function checkSoftDeletes() {
  const conn = await mysql.createConnection(DB_CONFIG);
  try {
    const [loans] = await conn.query('SELECT id, loan_id, status, principal_amount, deleted_at FROM loans');
    console.table(loans);
  } finally {
    await conn.end();
  }
}

checkSoftDeletes().catch(console.error);
