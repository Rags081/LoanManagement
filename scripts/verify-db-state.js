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

async function verifyAndCorrectDb() {
  const conn = await mysql.createConnection(DB_CONFIG);
  try {
    // 1. Correct LN-010 in database
    await conn.execute(`
      UPDATE loans
      SET principal_amount = 10000.00,
          interest_rate = 2000.0000,
          interest_rate_type = 'flat',
          total_expected_interest = 200000.00,
          total_expected_repayment = 210000.00,
          status = 'overdue'
      WHERE loan_id = 'LN-010' AND deleted_at IS NULL
    `);

    // 2. Ensure LN-006 is 0% flat interest (principal-only loan where 4000 is repaid, 6000 due)
    await conn.execute(`
      UPDATE loans
      SET principal_amount = 10000.00,
          interest_rate = 0.0000,
          interest_rate_type = 'flat',
          total_expected_interest = 0.00,
          total_expected_repayment = 10000.00,
          status = 'active'
      WHERE loan_id = 'LN-006' AND deleted_at IS NULL
    `);

    const [loans] = await conn.query(`
      SELECT 
        id, 
        loan_id, 
        principal_amount, 
        interest_rate, 
        interest_rate_type, 
        total_expected_interest, 
        total_expected_repayment, 
        status 
      FROM loans 
      WHERE deleted_at IS NULL
      ORDER BY id ASC
    `);

    console.log('=== VERIFIED LOANS IN DATABASE ===');
    console.table(loans);

  } finally {
    await conn.end();
  }
}

verifyAndCorrectDb().catch(console.error);
