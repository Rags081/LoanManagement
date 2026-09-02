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

async function checkExpectedInterest() {
  const conn = await mysql.createConnection(DB_CONFIG);
  try {
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
    `);
    
    console.log('=== ALL ACTIVE / STORED LOANS IN DB ===');
    console.table(loans);

    let sumDbExpected = 0;
    let sumFormula = 0;

    console.log('\n=== BREAKDOWN OF EXPECTED INTEREST ===');
    for (const l of loans) {
      const princ = Number(l.principal_amount);
      const rate = Number(l.interest_rate);
      const dbExp = Number(l.total_expected_interest);
      
      let calcExpected = 0;
      if (l.interest_rate_type === 'flat') {
        calcExpected = dbExp || (princ * rate / 100);
      } else {
        calcExpected = princ * rate / 100;
      }

      console.log(`Loan ${l.loan_id} (ID: ${l.id}, ${l.status}, ${l.interest_rate_type}): Principal = ₹${princ}, Rate = ${rate}%, DB total_expected_interest = ₹${dbExp} -> Expected Interest = ₹${calcExpected}`);
      sumDbExpected += dbExp;
      sumFormula += calcExpected;
    }

    console.log(`\nSUM(total_expected_interest from DB) = ₹${sumDbExpected}`);
    console.log(`SUM(calculated based on formula) = ₹${sumFormula}`);

    // Dashboard query:
    const [dashRows] = await conn.query(`
      SELECT IFNULL(SUM(CASE WHEN interest_rate_type = 'flat' THEN total_expected_interest ELSE (principal_amount * interest_rate / 100) END), 0) AS expected_interest
      FROM loans
      WHERE deleted_at IS NULL
    `);
    console.log('Dashboard Query result:', dashRows[0].expected_interest);

  } finally {
    await conn.end();
  }
}

checkExpectedInterest().catch(console.error);
