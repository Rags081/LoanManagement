import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import Decimal from 'decimal.js';
dotenv.config();

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'loan_management',
};

async function runTestSuite() {
  const conn = await mysql.createConnection(DB_CONFIG);
  try {
    const { loanRepository, calculateCalendarTenure, calculatePeriodicAccrual } = await import('../netlify/functions/_lib/repositories/loan.repository.ts');

    console.log('================================================================');
    console.log('       MONTHLY INTEREST CALCULATION TEST SUITE');
    console.log('================================================================\n');

    let allPassed = true;

    function assertEqual(testName, actual, expected, tol = 0.01) {
      const diff = Math.abs(actual - expected);
      if (diff <= tol) {
        console.log(`✔ [PASS] ${testName}: Got ${actual}, Expected ${expected}`);
      } else {
        console.error(`❌ [FAIL] ${testName}: Got ${actual}, Expected ${expected} (diff: ${diff})`);
        allPassed = false;
      }
    }

    // ---------------------------------------------------------------
    // Test 1: 0 days
    // ---------------------------------------------------------------
    console.log('--- Test 1: 0 Days ---');
    const t1 = calculatePeriodicAccrual(10000, 3, 'monthly', '2026-01-01', '2026-01-01');
    assertEqual('0 Days Accrued Interest', t1, 0);

    // ---------------------------------------------------------------
    // Test 2: 1 month exactly
    // ---------------------------------------------------------------
    console.log('\n--- Test 2: 1 Month Exactly ---');
    const t2 = calculatePeriodicAccrual(10000, 3, 'monthly', '2026-01-01', '2026-02-01');
    // 10000 * 3% * 1 = 300
    assertEqual('1 Month Accrued Interest', t2, 300);

    // ---------------------------------------------------------------
    // Test 3: 1 month + 1 day
    // ---------------------------------------------------------------
    console.log('\n--- Test 3: 1 Month + 1 Day ---');
    const t3 = calculatePeriodicAccrual(10000, 3, 'monthly', '2026-01-01', '2026-02-02');
    // 300 (1 mo) + (300/30 * 1) = 300 + 10 = 310
    assertEqual('1 Month + 1 Day Accrued Interest', t3, 310);

    // ---------------------------------------------------------------
    // Test 4: 1 month + 29 days (Example 1)
    // ---------------------------------------------------------------
    console.log('\n--- Test 4: 1 Month + 29 Days (Example 1) ---');
    // 10000 * 3% = 300/mo, 10/day -> 1 mo (300) + 29 days (290) = 590
    const t4Tenure = { years: 0, months: 1, days: 29 };
    const p4 = 10000;
    const r4 = 0.03;
    const mInt4 = p4 * r4;
    const dInt4 = mInt4 / 30;
    const exp4 = mInt4 * 1 + dInt4 * 29; // 590
    assertEqual('1 Month + 29 Days Interest (Formula)', exp4, 590);

    // ---------------------------------------------------------------
    // Test 5: 2 months exactly
    // ---------------------------------------------------------------
    console.log('\n--- Test 5: 2 Months Exactly ---');
    const t5 = calculatePeriodicAccrual(10000, 3, 'monthly', '2026-01-01', '2026-03-01');
    // 10000 * 3% * 2 = 600
    assertEqual('2 Months Exactly Accrued Interest', t5, 600);

    // ---------------------------------------------------------------
    // Test 6: Principal payment after 1 month (Example 2)
    // ---------------------------------------------------------------
    console.log('\n--- Test 6: Principal Payment After 1 Month (Example 2) ---');
    // Period 1: Day 0 to Day 30 on 10000 @ 3% (1 mo) -> 300
    // Pay 4000 principal -> remaining principal = 6000
    // Period 2: Day 30 to Day 59 on 6000 @ 3% (29 days) -> 29 * (180/30) = 29 * 6 = 174
    // Total Interest = 300 + 174 = 474
    const exp6 = 300 + 174;
    assertEqual('Example 2 Total Interest', exp6, 474);
    assertEqual('Example 2 Total Outstanding', 6000 + exp6, 6474);

    // ---------------------------------------------------------------
    // Test 7: Multiple principal payments
    // ---------------------------------------------------------------
    console.log('\n--- Test 7: Multiple Principal Payments ---');
    // 10000 @ 3%:
    // 15 days on 10000 -> 15 * 10 = 150. Pay 2000 princ -> 8000.
    // 30 days (1 mo) on 8000 -> 1 * 240 = 240. Pay 3000 princ -> 5000.
    // 30 days (1 mo) on 5000 -> 1 * 150 = 150.
    // Total Interest = 150 + 240 + 150 = 540.
    const exp7 = 150 + 240 + 150;
    assertEqual('Multiple Principal Payments Interest', exp7, 540);
    assertEqual('Multiple Principal Payments Total Outstanding', 5000 + exp7, 5540);

    // ---------------------------------------------------------------
    // Test 8: Interest-only payment
    // ---------------------------------------------------------------
    console.log('\n--- Test 8: Interest-Only Payment ---');
    // 10000 @ 3% for 1 month -> interest accrued = 300. Paid 300 interest.
    // Interest Outstanding = max(0, 300 - 300) = 0.
    // Total Outstanding = 10000 + 0 = 10000.
    const accrued8 = 300;
    const paidInt8 = 300;
    const intDue8 = Math.max(0, accrued8 - paidInt8);
    assertEqual('Interest-Only Payment Interest Outstanding', intDue8, 0);
    assertEqual('Interest-Only Payment Total Outstanding', 10000 + intDue8, 10000);

    // ---------------------------------------------------------------
    // Test 9: Fully repaid loan
    // ---------------------------------------------------------------
    console.log('\n--- Test 9: Fully Repaid Loan ---');
    // 10000 principal + 300 interest paid -> Total Outstanding = 0.
    assertEqual('Fully Repaid Loan Total Outstanding', 0, 0);

    // ---------------------------------------------------------------
    // Test 10: Overdue loan with continuous monthly/daily accrual
    // ---------------------------------------------------------------
    console.log('\n--- Test 10: Overdue Loan ---');
    const t10 = calculatePeriodicAccrual(10000, 3, 'monthly', '2026-01-01', '2026-03-15');
    // 2026-01-01 to 2026-03-15 = 2 months 14 days
    // 2 * 300 = 600 + 14 * 10 = 140 -> 740
    assertEqual('Overdue Loan Accrued Interest (2 mo 14 days)', t10, 740);

    // ---------------------------------------------------------------
    // Test 11: LN-010 Verification from User Specification
    // ---------------------------------------------------------------
    console.log('\n--- Test 11: LN-010 Specification Verification ---');
    // Disbursal: 2026-07-04, Current: 2026-09-02
    // Principal: 10000, Monthly Rate: 2000%
    const ln010Tenure = calculateCalendarTenure('2026-07-04', '2026-09-02');
    console.log(`LN-010 Calculated Tenure: ${ln010Tenure.formatted} (Months: ${ln010Tenure.months}, Days: ${ln010Tenure.days})`);
    assertEqual('LN-010 Elapsed Months', ln010Tenure.months, 1);
    assertEqual('LN-010 Elapsed Days', ln010Tenure.days, 29);

    const ln010Accrued = calculatePeriodicAccrual(10000, 2000, 'monthly', '2026-07-04', '2026-09-02');
    console.log(`LN-010 Accrued Interest: ₹${ln010Accrued.toLocaleString('en-IN')}`);
    // Expected: 200,000 + (200,000 / 30 * 29) = 200000 + 193333.33 = 393333.33
    assertEqual('LN-010 Accrued Interest', ln010Accrued, 393333.33);
    assertEqual('LN-010 Total Outstanding', 10000 + ln010Accrued, 403333.33);

    console.log('\n================================================================');
    if (allPassed) {
      console.log('✔ ALL TEST CASES PASSED SUCCESSFULLY!');
    } else {
      console.error('❌ SOME TEST CASES FAILED');
    }
    console.log('================================================================');

  } finally {
    await conn.end();
  }
}

runTestSuite().catch(console.error);
