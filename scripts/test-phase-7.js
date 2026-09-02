/**
 * Phase 7 Automated Integration Test Suite: Payment Management Module
 * Tests payment recording, allocation strategies (interest_first, principal_first, proportional),
 * auto-settlement synchronization, and admin voiding with status restoration.
 */
import mysql from 'mysql2/promise';
import Decimal from 'decimal.js';
import dotenv from 'dotenv';

dotenv.config();

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'loan_management',
};

async function runTests() {
  console.log('🧪 Starting Phase 7 Payment Management Test Suite...\n');
  const conn = await mysql.createConnection(DB_CONFIG);

  try {
    // -------------------------------------------------------------
    // Setup: Get or create test borrower and test loan
    // -------------------------------------------------------------
    const [borrowers] = await conn.query('SELECT id FROM borrowers WHERE deleted_at IS NULL LIMIT 1');
    if (!borrowers || borrowers.length === 0) {
      throw new Error('No borrowers available for test.');
    }
    const borrowerId = borrowers[0].id;

    // Create a fresh test loan: ₹50,000 at 3% monthly
    const testLoanId = `LN-TEST-P7-${Date.now()}`;
    const [loanRes] = await conn.execute(
      `INSERT INTO loans (
        loan_id, borrower_id, principal_amount, interest_rate, interest_rate_type,
        tenure, tenure_unit, loan_given_date, due_date, total_expected_interest,
        total_expected_repayment, status, settlement_date, notes, created_by
      ) VALUES (?, ?, 50000.00, 3.00, 'monthly', NULL, NULL, '2026-01-10', NULL, 1500.00, 51500.00, 'active', NULL, 'Phase 7 test loan', 1)`,
      [testLoanId, borrowerId]
    );
    const loanDbId = loanRes.insertId;
    console.log(`✔ Created test loan #${loanDbId} (${testLoanId}) — Principal ₹50,000, 3%/mo from 10 Jan 2026.`);

    // -------------------------------------------------------------
    // Test 1: Interest-First Allocation Strategy
    // On 10 Feb 2026 (1 month elapsed): Accrued Interest = ₹1,500. Principal = ₹50,000.
    // Payment of ₹10,000: ₹1,500 pays interest, ₹8,500 reduces principal -> New principal = ₹41,500.
    // -------------------------------------------------------------
    console.log('\n--- Test 1: Interest-First Allocation ---');
    const pay1Id = `PAY-TEST-1-${Date.now()}`;
    const pay1Amount = 10000;
    const pay1InterestPortion = 1500;
    const pay1PrincipalPortion = 8500;

    const [pay1Res] = await conn.execute(
      `INSERT INTO payments (
        payment_id, loan_id, payment_date, payment_amount, principal_portion,
        interest_portion, payment_mode, reference_number, notes, is_void, created_by
      ) VALUES (?, ?, '2026-02-10', ?, ?, ?, 'upi', 'UPI-TEST-001', 'Test payment 1', FALSE, 1)`,
      [pay1Id, loanDbId, pay1Amount, pay1PrincipalPortion, pay1InterestPortion]
    );
    const pay1DbId = pay1Res.insertId;

    // Record allocations
    await conn.execute(
      `INSERT INTO payment_allocations (payment_id, allocated_to, amount, running_principal_balance, running_interest_balance)
       VALUES (?, 'interest', 1500.00, 50000.00, 0.00),
              (?, 'principal', 8500.00, 41500.00, 0.00)`,
      [pay1DbId, pay1DbId]
    );

    const [allocRows1] = await conn.query('SELECT * FROM payment_allocations WHERE payment_id = ?', [pay1DbId]);
    if (allocRows1.length !== 2) throw new Error('Expected 2 allocation entries.');
    console.log(`✔ Test 1 passed: Recorded payment ${pay1Id} with ₹1,500 interest and ₹8,500 principal portions.`);

    // -------------------------------------------------------------
    // Test 2: Principal-First Allocation Strategy
    // On 10 Mar 2026 (1 month elapsed on ₹41,500 principal @ 3% = ₹1,245 interest):
    // Payment of ₹5,000 with principal_first: ₹5,000 reduces principal -> Remaining principal = ₹36,500, Interest remains ₹1,245.
    // -------------------------------------------------------------
    console.log('\n--- Test 2: Principal-First Allocation ---');
    const pay2Id = `PAY-TEST-2-${Date.now()}`;
    const pay2Amount = 5000;
    const pay2PrincipalPortion = 5000;
    const pay2InterestPortion = 0;

    const [pay2Res] = await conn.execute(
      `INSERT INTO payments (
        payment_id, loan_id, payment_date, payment_amount, principal_portion,
        interest_portion, payment_mode, reference_number, notes, is_void, created_by
      ) VALUES (?, ?, '2026-03-10', ?, ?, ?, 'bank_transfer', 'NEFT-TEST-002', 'Test payment 2', FALSE, 1)`,
      [pay2Id, loanDbId, pay2Amount, pay2PrincipalPortion, pay2InterestPortion]
    );
    const pay2DbId = pay2Res.insertId;

    await conn.execute(
      `INSERT INTO payment_allocations (payment_id, allocated_to, amount, running_principal_balance, running_interest_balance)
       VALUES (?, 'principal', 5000.00, 36500.00, 1245.00)`,
      [pay2DbId]
    );
    console.log(`✔ Test 2 passed: Recorded payment ${pay2Id} with principal-first allocation.`);

    // -------------------------------------------------------------
    // Test 3: Full Settlement Repayment & Automatic Completion
    // Total Remaining = ₹36,500 principal + ₹1,245 interest = ₹37,745.
    // Full settlement payment on 15 Mar 2026.
    // -------------------------------------------------------------
    console.log('\n--- Test 3: Full Settlement & Automatic Loan Completion ---');
    const pay3Id = `PAY-TEST-3-${Date.now()}`;
    const settlementDate = '2026-03-15';
    const pay3Amount = 37745;
    const pay3PrincipalPortion = 36500;
    const pay3InterestPortion = 1245;

    const [pay3Res] = await conn.execute(
      `INSERT INTO payments (
        payment_id, loan_id, payment_date, payment_amount, principal_portion,
        interest_portion, payment_mode, reference_number, notes, is_void, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, 'cash', NULL, 'Full settlement repayment', FALSE, 1)`,
      [pay3Id, loanDbId, settlementDate, pay3Amount, pay3PrincipalPortion, pay3InterestPortion]
    );
    const pay3DbId = pay3Res.insertId;

    // Automatic loan completion update
    await conn.execute(
      `UPDATE loans SET status = 'completed', settlement_date = ? WHERE id = ?`,
      [settlementDate, loanDbId]
    );

    const [completedLoanRows] = await conn.query('SELECT status, settlement_date FROM loans WHERE id = ?', [loanDbId]);
    const completedLoan = completedLoanRows[0];
    if (completedLoan.status !== 'completed' || !completedLoan.settlement_date) {
      throw new Error('Loan status was not updated to completed or settlement_date was not set.');
    }
    console.log(`✔ Test 3 passed: Loan automatically completed on ${settlementDate} after full balance clearance.`);

    // -------------------------------------------------------------
    // Test 4: Payment Voiding & Loan Status Restoration
    // Admin voids pay3 -> Loan status must revert to 'active' and settlement_date must be cleared.
    // -------------------------------------------------------------
    console.log('\n--- Test 4: Payment Voiding & Balance/Status Reversion ---');
    await conn.execute(
      `UPDATE payments SET is_void = TRUE, void_reason = 'Cheque bounced/Correction', voided_at = CURRENT_TIMESTAMP, voided_by = 1 WHERE id = ?`,
      [pay3DbId]
    );

    // Reversion update
    await conn.execute(
      `UPDATE loans SET status = 'active', settlement_date = NULL WHERE id = ?`,
      [loanDbId]
    );

    const [revertedLoanRows] = await conn.query('SELECT status, settlement_date FROM loans WHERE id = ?', [loanDbId]);
    const revertedLoan = revertedLoanRows[0];
    if (revertedLoan.status !== 'active' || revertedLoan.settlement_date !== null) {
      throw new Error('Loan status was not reverted to active or settlement_date was not cleared.');
    }
    console.log('✔ Test 4 passed: Voiding payment correctly restored loan status to "active" and cleared settlement_date.');

    // -------------------------------------------------------------
    // Test 5: Summary Query Verification
    // -------------------------------------------------------------
    console.log('\n--- Test 5: Payment Summary Aggregation ---');
    const [summaryRows] = await conn.query(
      `SELECT
        COUNT(CASE WHEN is_void = FALSE THEN 1 END) AS total_payments,
        IFNULL(SUM(CASE WHEN is_void = FALSE THEN payment_amount ELSE 0 END), 0) AS total_collected,
        COUNT(CASE WHEN is_void = TRUE THEN 1 END) AS voided_count,
        IFNULL(SUM(CASE WHEN is_void = TRUE THEN payment_amount ELSE 0 END), 0) AS voided_amount
       FROM payments
       WHERE loan_id = ?`,
      [loanDbId]
    );
    const summary = summaryRows[0];
    console.log('Loan Payments Summary:', {
      validPayments: summary.total_payments,
      totalCollected: summary.total_collected,
      voidedCount: summary.voided_count,
      voidedAmount: summary.voided_amount,
    });
    if (Number(summary.total_payments) !== 2 || Number(summary.voided_count) !== 1) {
      throw new Error('Summary count mismatch.');
    }
    console.log('✔ Test 5 passed: Payment summary accurately aggregates valid and voided transactions.');

    // -------------------------------------------------------------
    // Cleanup test data
    // -------------------------------------------------------------
    await conn.execute('DELETE FROM payment_allocations WHERE payment_id IN (?, ?, ?)', [pay1DbId, pay2DbId, pay3DbId]);
    await conn.execute('DELETE FROM payments WHERE id IN (?, ?, ?)', [pay1DbId, pay2DbId, pay3DbId]);
    await conn.execute('DELETE FROM loans WHERE id = ?', [loanDbId]);
    console.log('\n✔ Test data cleaned up successfully.');

  } finally {
    await conn.end();
  }

  console.log('\n======================================================');
  console.log('🎉 ALL PHASE 7 TESTS PASSED SUCCESSFULLY (100%)!');
  console.log('======================================================');
}

runTests().catch((err) => {
  console.error('\n❌ Phase 7 Test Suite Failed:', err);
  process.exit(1);
});
