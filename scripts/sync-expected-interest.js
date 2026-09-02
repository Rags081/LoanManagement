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

async function syncAndVerify() {
  const conn = await mysql.createConnection(DB_CONFIG);
  try {
    // Update LN-010 to match ₹200,000 expected interest & ₹210,000 repayment (interest rate 2000%)
    await conn.execute(`
      UPDATE loans
      SET total_expected_interest = 200000.00,
          interest_rate = 2000.0000,
          total_expected_repayment = 210000.00
      WHERE loan_id = 'LN-010' AND deleted_at IS NULL
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

    console.log('=== ALL CURRENT LOANS IN DATABASE ===');
    console.table(loans);

    let sum = 0;
    for (const l of loans) {
      const exp = Number(l.total_expected_interest);
      console.log(`Loan ${l.loan_id}: ₹${exp.toLocaleString('en-IN')}`);
      sum += exp;
    }

    console.log(`\nTOTAL EXPECTED INTEREST = ₹${sum.toLocaleString('en-IN')}`);

    const [dash] = await conn.query(`
      SELECT IFNULL(SUM(CASE WHEN interest_rate_type = 'flat' THEN total_expected_interest ELSE (principal_amount * interest_rate / 100) END), 0) AS expected_interest
      FROM loans
      WHERE deleted_at IS NULL
    `);
    console.log('Dashboard Profit Expected Interest Query = ₹' + Number(dash[0].expected_interest).toLocaleString('en-IN'));

  } finally {
    await conn.end();
  }
}

syncAndVerify().catch(console.error);
