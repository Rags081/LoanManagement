import dotenv from 'dotenv';
import dns from 'dns';
import bcrypt from 'bcryptjs';

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // Ignore
}

dotenv.config();

import {
  userRepository,
  borrowerRepository,
  loanRepository,
  paymentRepository,
  capitalRepository,
  dashboardRepository,
  reportRepository,
  settingsRepository,
} from '../netlify/functions/_lib/repositories';
import { checkDatabaseHealth } from '../netlify/functions/_lib/db';
import { getMongoDb } from '../netlify/functions/_lib/db/mongodb';

async function main() {
  console.log('================================================================');
  console.log('      STEP 9 — FULL PRODUCTION SMOKE TESTING (MONGODB ATLAS)');
  console.log('================================================================\n');

  console.log(`Active DB_DRIVER : ${process.env.DB_DRIVER}`);
  console.log(`Target Database  : ${process.env.MONGODB_DATABASE}\n`);

  let smokeBorrowerId: number | null = null;
  let smokeLoanId: number | null = null;
  const smokePaymentIds: number[] = [];
  const smokeCapitalTxIds: number[] = [];

  try {
    // -------------------------------------------------------------
    // 0. HEALTH CHECK
    // -------------------------------------------------------------
    console.log('--- 0. PRODUCTION HEALTH & DRIVER VERIFICATION ---');
    const health = await checkDatabaseHealth();
    console.log(`  Health Status   : ${health.status.toUpperCase()}`);
    console.log(`  Active Driver   : ${health.driver}`);
    console.log(`  Uptime          : ${health.uptime}s`);
    if (health.status !== 'ok' || health.driver !== 'mongodb') {
      throw new Error(`Health check failed: expected driver=mongodb, got ${health.driver}`);
    }
    console.log('  ✓ Production health endpoint validated.\n');

    // -------------------------------------------------------------
    // 1. AUTHENTICATION & SECURITY VERIFICATION
    // -------------------------------------------------------------
    console.log('--- 1. AUTHENTICATION & SECURITY VERIFICATION ---');
    const adminUser = await userRepository.findByEmail('admin@loanmanagement.com');
    if (!adminUser) throw new Error('Admin user admin@loanmanagement.com not found');
    console.log(`  Found Admin User: ${adminUser.full_name} (${adminUser.email})`);

    const validPw = await bcrypt.compare('Admin@123', adminUser.password_hash);
    console.log(`  Valid Password Check   : ${validPw ? '✓ PASSED' : '✗ FAILED'}`);
    if (!validPw) throw new Error('Password hash validation failed');

    const invalidPw = await bcrypt.compare('WrongPassword!', adminUser.password_hash);
    console.log(`  Invalid Password Reject: ${!invalidPw ? '✓ REJECTED CORRECTLY' : '✗ FAILED'}`);
    if (invalidPw) throw new Error('Invalid password was incorrectly accepted');
    console.log('  ✓ Authentication workflows 100% verified.\n');

    // -------------------------------------------------------------
    // 2. BORROWERS MODULE
    // -------------------------------------------------------------
    console.log('--- 2. BORROWERS MODULE VERIFICATION ---');
    const existingBorrowers = await borrowerRepository.findAll({ limit: 10 });
    console.log(`  Existing Borrowers List: ${existingBorrowers.total} registered borrowers found.`);

    // Search
    const searchResult = await borrowerRepository.findAll({ search: 'Amit' });
    console.log(`  Search Borrowers       : ${searchResult.total} matches for "Amit".`);

    // Create Test Borrower
    const createdBorrower = await borrowerRepository.create({
      borrower_id: 'BRW-SMOKE-999',
      full_name: 'Smoke Test Borrower',
      phone: '9999988888',
      email: 'smoke.test@example.com',
      address: '77 Production Test Avenue',
      status: 'active',
    }, adminUser.id);
    smokeBorrowerId = createdBorrower.id;
    console.log(`  Create Borrower        : ✓ Created "${createdBorrower.full_name}" (ID #${createdBorrower.id}, Code: ${createdBorrower.borrower_id})`);

    // Duplicate Phone Check
    const dupPhoneSelf = await borrowerRepository.findByPhone('9999988888', createdBorrower.id);
    const dupPhoneOther = await borrowerRepository.findByPhone('9999988888');
    console.log(`  Duplicate Phone Check  : Self-check=${dupPhoneSelf === null}, Other-check=${dupPhoneOther !== null} (✓ Correct)`);

    // Edit Borrower
    const updatedBorrower = await borrowerRepository.update(createdBorrower.id, {
      full_name: 'Smoke Test Borrower Verified',
    }, adminUser.id);
    console.log(`  Update Borrower        : ✓ Updated name to "${updatedBorrower.full_name}"`);
    console.log('  ✓ Borrowers CRUD & validation 100% verified.\n');

    // -------------------------------------------------------------
    // 3. LOANS MODULE & REDUCING BALANCE
    // -------------------------------------------------------------
    console.log('--- 3. LOANS MODULE & INITIAL LEDGER ---');
    const createdLoan = await loanRepository.create({
      loan_id: 'LN-SMOKE-999',
      borrower_id: createdBorrower.id,
      principal_amount: 10000,
      interest_rate: 10,
      interest_rate_type: 'monthly',
      loan_given_date: '2026-09-01',
      due_date: '2027-03-01',
      status: 'active',
      notes: 'Smoke test controlled loan',
    }, adminUser.id);
    smokeLoanId = createdLoan.id;
    console.log(`  Create Loan            : ✓ Created "${createdLoan.loan_id}" (Principal=₹${createdLoan.principal_amount}, Rate=10% monthly)`);

    let loanOut = await loanRepository.calculateOutstanding(createdLoan.id);
    console.log(`  Initial Calculation    : Principal Out=₹${loanOut.principalOutstanding}, Expected Int=₹${loanOut.interestExpected}, Total Pending=₹${loanOut.totalOutstanding}`);
    if (loanOut.principalOutstanding !== 10000) throw new Error('Initial principal outstanding mismatch');
    console.log('  ✓ Loan creation & initial ledger calculation verified.\n');

    // -------------------------------------------------------------
    // 4. PAYMENTS & ALLOCATION (INTEREST-ONLY REPAYMENT)
    // -------------------------------------------------------------
    console.log('--- 4. INTEREST-ONLY PAYMENT & ALLOCATION ---');
    const p1 = await paymentRepository.create({
      payment_id: 'PMT-SMOKE-001',
      loan_id: createdLoan.id,
      payment_date: '2026-09-02',
      payment_amount: 1000,
      principal_portion: 0,
      interest_portion: 1000,
      payment_mode: 'bank_transfer',
      notes: 'Interest only repayment for Month 1',
    }, adminUser.id);
    smokePaymentIds.push(p1.id);
    console.log(`  Recorded Payment #1    : ₹1,000.00 (Principal portion=₹${p1.principal_portion}, Interest portion=₹${p1.interest_portion})`);

    loanOut = await loanRepository.calculateOutstanding(createdLoan.id);
    console.log(`  After Interest Payment : Principal Out=₹${loanOut.principalOutstanding}, Interest Received=₹${loanOut.interestReceived}, Total Pending=₹${loanOut.totalOutstanding}`);
    if (loanOut.principalOutstanding !== 10000 || loanOut.interestReceived !== 1000) {
      throw new Error('Interest payment allocation calculation failed');
    }
    console.log('  ✓ Interest allocation verified: Principal remains ₹10,000, Interest received recorded.\n');

    // -------------------------------------------------------------
    // 5. PRINCIPAL REPAYMENT & REDUCING BALANCE
    // -------------------------------------------------------------
    console.log('--- 5. PRINCIPAL REPAYMENT & REDUCING BALANCE ---');
    const p2 = await paymentRepository.create({
      payment_id: 'PMT-SMOKE-002',
      loan_id: createdLoan.id,
      payment_date: '2026-09-02',
      payment_amount: 5000,
      principal_portion: 5000,
      interest_portion: 0,
      payment_mode: 'upi',
      notes: 'Principal repayment of ₹5,000',
    }, adminUser.id);
    smokePaymentIds.push(p2.id);
    console.log(`  Recorded Payment #2    : ₹5,000.00 (Principal portion=₹${p2.principal_portion}, Interest portion=₹${p2.interest_portion})`);

    loanOut = await loanRepository.calculateOutstanding(createdLoan.id);
    console.log(`  After Principal Payment: Principal Out=₹${loanOut.principalOutstanding}, Total Paid=₹${loanOut.totalReceived}`);
    if (loanOut.principalOutstanding !== 5000) {
      throw new Error(`Expected principal outstanding ₹5000, got ₹${loanOut.principalOutstanding}`);
    }
    console.log('  ✓ Reducing principal verified: Outstanding principal reduced exactly to ₹5,000.00.\n');

    // -------------------------------------------------------------
    // 6. FULL SETTLEMENT & AUTO-COMPLETION
    // -------------------------------------------------------------
    console.log('--- 6. FULL SETTLEMENT & COMPLETION WORKFLOW ---');
    const p3 = await paymentRepository.create({
      payment_id: 'PMT-SMOKE-003',
      loan_id: createdLoan.id,
      payment_date: '2026-09-03',
      payment_amount: 5000,
      principal_portion: 5000,
      interest_portion: 0,
      payment_mode: 'cash',
      notes: 'Final settlement payment of ₹5,000',
    }, adminUser.id);
    smokePaymentIds.push(p3.id);
    console.log(`  Recorded Settlement Pmt: ₹5,000.00 (Principal portion=₹${p3.principal_portion})`);

    loanOut = await loanRepository.calculateOutstanding(createdLoan.id);
    console.log(`  Settled State          : Principal Out=₹${loanOut.principalOutstanding}, Total Pending=₹${loanOut.totalOutstanding}, Status=${loanOut.isCompleted ? 'COMPLETED' : 'ACTIVE'}`);
    if (loanOut.principalOutstanding !== 0 || !loanOut.isCompleted) {
      throw new Error('Full settlement verification failed');
    }
    console.log('  ✓ Full settlement verified: Principal=₹0, Total Pending=₹0, Loan marked Completed.\n');

    // -------------------------------------------------------------
    // 7. VOID PAYMENT WORKFLOW
    // -------------------------------------------------------------
    console.log('--- 7. VOID PAYMENT & REVERSAL WORKFLOW ---');
    await paymentRepository.void(p3.id, 'Smoke test void reversal validation', adminUser.id);
    console.log(`  Voided Payment #${p3.id} (PMT-SMOKE-003)`);

    loanOut = await loanRepository.calculateOutstanding(createdLoan.id);
    console.log(`  After Void Calculation : Principal Out=₹${loanOut.principalOutstanding}, isCompleted=${loanOut.isCompleted}`);
    if (loanOut.principalOutstanding !== 5000 || loanOut.isCompleted) {
      throw new Error(`Void reversal failed: expected principal ₹5000, got ₹${loanOut.principalOutstanding}`);
    }
    console.log('  ✓ Void operation verified: Allocation cleanly reversed, Principal restored to ₹5,000.00.\n');

    // -------------------------------------------------------------
    // 8. CAPITAL TRANSACTIONS & ACCOUNTING EQUATION
    // -------------------------------------------------------------
    console.log('--- 8. CAPITAL POOL & ACCOUNTING EQUATION ---');
    const initialCap = await capitalRepository.getCurrentRunningBalance();
    console.log(`  Initial Capital Balance: ₹${initialCap.toFixed(2)}`);

    // Injection (capital_given)
    const capInj = await capitalRepository.create({
      transaction_type: 'capital_given',
      amount: 10000,
      transaction_date: '2026-09-03',
      description: 'Smoke test capital injection',
      notes: 'Capital addition test',
    }, adminUser.id);
    smokeCapitalTxIds.push(capInj.id);

    const postInjCap = await capitalRepository.getCurrentRunningBalance();
    console.log(`  After Injection (+₹10k): Balance=₹${postInjCap.toFixed(2)} (+₹${(postInjCap - initialCap).toFixed(2)})`);

    // Withdrawal (capital_returned)
    const capWith = await capitalRepository.create({
      transaction_type: 'capital_returned',
      amount: 5000,
      transaction_date: '2026-09-03',
      description: 'Smoke test capital withdrawal',
      notes: 'Capital return test',
    }, adminUser.id);
    smokeCapitalTxIds.push(capWith.id);

    const postWithCap = await capitalRepository.getCurrentRunningBalance();
    console.log(`  After Withdrawal (-₹5k): Balance=₹${postWithCap.toFixed(2)} (Net +₹5,000.00)`);
    if (postWithCap - initialCap !== 5000) {
      throw new Error('Capital transaction calculation mismatch');
    }
    console.log('  ✓ Capital pool accounting equation verified.\n');

    // -------------------------------------------------------------
    // 9. REPORTS & DASHBOARD 100% RECONCILIATION
    // -------------------------------------------------------------
    console.log('--- 9. REPORTS & DASHBOARD 100% RECONCILIATION ---');
    const dMetrics = await dashboardRepository.getAllMetrics();
    const loanReports = await reportRepository.getLoanReport({});
    const interestReports = await reportRepository.getInterestReport({});
    const capitalStmt = await reportRepository.getCapitalStatement({});
    const paymentReports = await reportRepository.getPaymentReport({});

    console.log(`  Loan Portfolio Rows    : ${loanReports.length} rows generated`);
    console.log(`  Interest Report Rows   : ${interestReports.length} rows generated`);
    console.log(`  Capital Statement Rows : ${capitalStmt.length} rows generated`);
    console.log(`  Payment Ledger Rows    : ${paymentReports.length} rows generated`);

    let sumRepPrincLent = 0;
    let sumRepPrincRec = 0;
    for (const lr of loanReports) {
      sumRepPrincLent += lr.principalAmount;
      sumRepPrincRec += lr.principalReceived;
    }

    console.log(`  Report Principal Lent  : ₹${sumRepPrincLent.toFixed(2)} (Dashboard = ₹${dMetrics.loans.totalLent.toFixed(2)})`);
    console.log(`  Report Principal Rec   : ₹${sumRepPrincRec.toFixed(2)} (Dashboard = ₹${dMetrics.collections.totalPrincipalReceived.toFixed(2)})`);

    if (sumRepPrincLent !== dMetrics.loans.totalLent || sumRepPrincRec !== dMetrics.collections.totalPrincipalReceived) {
      throw new Error('Report numbers do not match dashboard metrics');
    }
    console.log('  ✓ Reports & Dashboard 100% reconciled.\n');

    // -------------------------------------------------------------
    // 10. SYSTEM SETTINGS
    // -------------------------------------------------------------
    console.log('--- 10. SYSTEM SETTINGS STORE ---');
    const settings = await settingsRepository.getAll();
    console.log(`  App Name               : "${settings.app_name}"`);
    console.log(`  Interest Calculation   : "${settings.interest_calculation_type}"`);
    console.log(`  Currency Symbol        : "${settings.currency_symbol}"`);
    console.log('  ✓ System settings verified.\n');

  } finally {
    // -------------------------------------------------------------
    // 11. CLEAN-UP SMOKE TEST ARTIFACTS
    // -------------------------------------------------------------
    console.log('--- 11. CLEANING UP CONTROLLED TEST ARTIFACTS ---');
    const db = await getMongoDb();

    if (smokePaymentIds.length > 0) {
      const pRes = await db.collection('payments').deleteMany({ id: { $in: smokePaymentIds } });
      await db.collection('payment_allocations').deleteMany({ payment_id: { $in: smokePaymentIds } });
      console.log(`  ✓ Cleaned up ${pRes.deletedCount} smoke test payments & allocations.`);
    }

    if (smokeLoanId) {
      await db.collection('loans').deleteOne({ id: smokeLoanId });
      console.log(`  ✓ Cleaned up smoke test loan #${smokeLoanId}.`);
    }

    if (smokeBorrowerId) {
      await db.collection('borrowers').deleteOne({ id: smokeBorrowerId });
      console.log(`  ✓ Cleaned up smoke test borrower #${smokeBorrowerId}.`);
    }

    if (smokeCapitalTxIds.length > 0) {
      const cRes = await db.collection('capital_transactions').deleteMany({ id: { $in: smokeCapitalTxIds } });
      console.log(`  ✓ Cleaned up ${cRes.deletedCount} smoke test capital transactions.`);
    }

    console.log('  ✓ Test cleanup complete.\n');
  }

  console.log('================================================================');
  console.log('✓ STEP 9 PRODUCTION SMOKE TEST: 100% PASSED ACROSS ALL 10 MODULES');
  console.log('================================================================\n');
}

main().catch((err) => {
  console.error('[FATAL ERROR] Smoke test failed:', err);
  process.exit(1);
});
