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

async function inspectDetail() {
  const conn = await mysql.createConnection(DB_CONFIG);
  try {
    const [loans] = await conn.query('SELECT * FROM loans WHERE deleted_at IS NULL');
    console.log('LOANS IN DB:');
    for (const l of loans) {
      const [payments] = await conn.query('SELECT * FROM payments WHERE loan_id = ? AND is_void = FALSE', [l.id]);
      console.log(`\nLoan #${l.id} (${l.loan_id}):`, {
        status: l.status,
        principal: l.principal_amount,
        rate: l.interest_rate,
        rateType: l.interest_rate_type,
        expectedInterest: l.total_expected_interest,
        payments: payments.map(p => ({ amount: p.payment_amount, principal: p.principal_portion, interest: p.interest_portion }))
      });
    }
  } finally {
    await conn.end();
  }
}

inspectDetail().catch(console.error);
