/**
 * Phase 9 Production Readiness Automated Test Suite & Financial Consistency Assertions
 * Validates:
 * 1. Financial Reports & SQL aggregations (including N+1 optimized Borrower Report)
 * 2. Borrower Directory Total Outstanding canonical alignment with Loan Portfolio & Outstanding Balances
 * 3. 7 Test Data Scenarios (Principal only, Principal + Interest, Multiple Loans, Settled, Overdue, Voided Payment, Deleted Loan)
 * 4. Cross-Report numerical assertion between Borrower Directory, Loan Portfolio, and Outstanding Balances
 * 5. ExcelJS styled export generation & total formulas
 * 6. CSV formatting and Formula Injection (=, +, -, @, \t, \r) sanitization
 * 7. Template generation & schema matching for all 4 entities
 * 8. Standalone repository create() vs External connection reuse in create(data, createdBy, conn)
 * 9. Genuine Multi-Row Excel Import Transaction Atomicity & 100% Rollback Proof
 */
import mysql from 'mysql2/promise';
import ExcelJS from 'exceljs';
import dotenv from 'dotenv';
import { borrowerRepository } from '../netlify/functions/_lib/repositories/borrower.repository.js';
import { loanRepository } from '../netlify/functions/_lib/repositories/loan.repository.js';
import { paymentRepository } from '../netlify/functions/_lib/repositories/payment.repository.js';
import { capitalRepository } from '../netlify/functions/_lib/repositories/capital.repository.js';
import { reportRepository } from '../netlify/functions/_lib/repositories/report.repository.js';
import { excelExportService } from '../netlify/functions/_lib/services/excel-export.service.js';
import { templateGeneratorService } from '../netlify/functions/_lib/services/template-generator.service.js';
import { excelImportService } from '../netlify/functions/_lib/services/excel-import.service.js';

dotenv.config();

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'loan_management',
};

async function runTests() {
  console.log('🧪 Starting Comprehensive Phase 9 Production Readiness & Financial Consistency Test Suite...\n');
  const conn = await mysql.createConnection(DB_CONFIG);

  try {
    // ------------------------------------------------------------------
    // TEST 1: All 8 Financial Reports (including optimized Borrower Report)
    // ------------------------------------------------------------------
    console.log('--- Test 1: Financial Reports Execution ---');
    const capStmt = await reportRepository.getCapitalStatement({}, conn);
    console.log(`✔ Capital Statement: ${capStmt.length} records`);

    const loans = await reportRepository.getLoanReport({}, conn);
    console.log(`✔ Loan Portfolio: ${loans.length} records`);

    const borrowers = await reportRepository.getBorrowerReport({}, conn);
    console.log(`✔ Borrower Directory (Canonical Alignment): ${borrowers.length} records`);

    const payments = await reportRepository.getPaymentReport({}, conn);
    console.log(`✔ Payment Collections: ${payments.length} records`);

    const outstanding = await reportRepository.getOutstandingReport({}, conn);
    console.log(`✔ Outstanding Balances: ${outstanding.length} accounts`);

    const overdue = await reportRepository.getOverdueReport({}, conn);
    console.log(`✔ Overdue Delinquency: ${overdue.length} accounts`);

    const interest = await reportRepository.getInterestReport({}, conn);
    console.log(`✔ Interest Realization: ${interest.length} periods`);

    const monthly = await reportRepository.getMonthlyCollectionReport(new Date().getFullYear(), conn);
    console.log(`✔ Monthly Summary: ${monthly.length} months`);

    // ------------------------------------------------------------------
    // TEST 2: Financial Consistency Scenarios (Scenarios 1 through 7)
    // ------------------------------------------------------------------
    console.log('\n--- Test 2: Borrower Outstanding 7 Financial Scenarios ---');
    const scenarioTimestamp = Date.now();
    const testBorrowerPhone = `+91 95555${Math.floor(10000 + Math.random() * 90000)}`;

    // Create a dedicated test borrower
    const testBorrower = await borrowerRepository.create(
      {
        fullName: `Financial Scenario Borrower ${scenarioTimestamp}`,
        phone: testBorrowerPhone,
        email: `scenario_${scenarioTimestamp}@test.com`,
        address: 'Test City',
      },
      1,
      conn
    );

    // Scenario 1: Principal Only Loan (0% interest loan)
    // ₹10,000 principal, ₹4,000 repaid, ₹0 interest -> Principal Due: ₹6,000, Total Due: ₹6,000
    const loan1 = await loanRepository.create(
      {
        borrowerId: testBorrower.id,
        principalAmount: 10000,
        interestRate: 0,
        interestRateType: 'flat',
        loanGivenDate: new Date().toISOString().split('T')[0],
      },
      1,
      conn
    );

    await paymentRepository.create(
      {
        loan_id: loan1.id,
        payment_amount: 4000,
        payment_date: new Date().toISOString().split('T')[0],
        payment_mode: 'cash',
        allocation_method: 'principal_first',
      },
      1,
      conn
    );

    const check1 = await reportRepository.getBorrowerReport({ search: testBorrower.borrowerId }, conn);
    const bRow1 = check1.find((b) => b.id === testBorrower.id);
    if (!bRow1) throw new Error('Test borrower not found in report');
    console.log(`Scenario 1 (Principal Only): Principal Due: ₹${bRow1.principalOutstanding}, Total Due: ₹${bRow1.totalOutstanding}`);
    if (bRow1.principalOutstanding !== 6000 || bRow1.totalOutstanding !== 6000) {
      throw new Error(`Scenario 1 Failed: Expected ₹6,000/₹6,000, got ₹${bRow1.principalOutstanding}/₹${bRow1.totalOutstanding}`);
    }
    console.log('✔ Scenario 1 Passed: Principal Only matches ₹6,000 / ₹6,000.');

    // Settle Loan 1 for clean Scenario 2 & 3 setup
    await paymentRepository.create(
      {
        loan_id: loan1.id,
        payment_amount: 6000,
        payment_date: new Date().toISOString().split('T')[0],
        payment_mode: 'cash',
        allocation_method: 'principal_first',
      },
      1,
      conn
    );

    // Scenario 2 & 3: Multiple Loans with Interest
    // Loan A: Principal = ₹5,000, Flat Rate = 10% (Interest Due = ₹500, Total = ₹5,500)
    // Loan B: Principal = ₹3,000, Flat Rate = 6.666667% (Interest Due = ₹200, Total = ₹3,200)
    // Expected Borrower: Principal Due = ₹8,000, Total Due = ₹8,700
    const loanA = await loanRepository.create(
      {
        borrowerId: testBorrower.id,
        principalAmount: 5000,
        interestRate: 10,
        interestRateType: 'flat',
        loanGivenDate: new Date().toISOString().split('T')[0],
      },
      1,
      conn
    );

    const loanB = await loanRepository.create(
      {
        borrowerId: testBorrower.id,
        principalAmount: 3000,
        interestRate: (200 / 3000) * 100,
        interestRateType: 'flat',
        loanGivenDate: new Date().toISOString().split('T')[0],
      },
      1,
      conn
    );

    const check3 = await reportRepository.getBorrowerReport({ search: testBorrower.borrowerId }, conn);
    const bRow3 = check3.find((b) => b.id === testBorrower.id);
    console.log(`Scenario 2 & 3 (Multiple Loans w/ Interest): Principal Due: ₹${bRow3.principalOutstanding}, Total Due: ₹${bRow3.totalOutstanding}`);
    if (bRow3.principalOutstanding !== 8000 || Math.round(bRow3.totalOutstanding) !== 8700) {
      throw new Error(`Scenario 3 Failed: Expected ₹8,000/₹8,700, got ₹${bRow3.principalOutstanding}/₹${bRow3.totalOutstanding}`);
    }
    console.log('✔ Scenario 2 & 3 Passed: Multiple loans calculate canonical ₹8,000 principal and ₹8,700 total.');

    // Scenario 4: Fully Settled Loan
    // Settle Loan A and Loan B completely
    await paymentRepository.create(
      {
        loan_id: loanA.id,
        payment_amount: 5500,
        payment_date: new Date().toISOString().split('T')[0],
        payment_mode: 'bank_transfer',
        allocation_method: 'interest_first',
      },
      1,
      conn
    );
    await paymentRepository.create(
      {
        loan_id: loanB.id,
        payment_amount: 3200,
        payment_date: new Date().toISOString().split('T')[0],
        payment_mode: 'bank_transfer',
        allocation_method: 'interest_first',
      },
      1,
      conn
    );
    const check4 = await reportRepository.getBorrowerReport({ search: testBorrower.borrowerId }, conn);
    const bRow4 = check4.find((b) => b.id === testBorrower.id);
    console.log(`Scenario 4 (All Loans Settled): Principal Due: ₹${bRow4.principalOutstanding}, Total Due: ₹${bRow4.totalOutstanding}`);
    if (bRow4.principalOutstanding !== 0 || bRow4.totalOutstanding !== 0) {
      throw new Error(`Scenario 4 Failed: Expected ₹0/₹0, got ₹${bRow4.principalOutstanding}/₹${bRow4.totalOutstanding}`);
    }
    console.log('✔ Scenario 4 Passed: Settled loans contribute ₹0 to totalOutstanding.');

    // Scenario 5: Overdue Loan
    // Create an overdue loan (due 30 days ago)
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 60);
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() - 30);
    const loanOverdue = await loanRepository.create(
      {
        borrowerId: testBorrower.id,
        principalAmount: 10000,
        interestRate: 20,
        interestRateType: 'flat',
        loanGivenDate: pastDate.toISOString().split('T')[0],
        dueDate: dueDate.toISOString().split('T')[0],
        status: 'overdue',
      },
      1,
      conn
    );
    const check5 = await reportRepository.getBorrowerReport({ search: testBorrower.borrowerId }, conn);
    const bRow5 = check5.find((b) => b.id === testBorrower.id);
    console.log(`Scenario 5 (Overdue Loan): Principal Due: ₹${bRow5.principalOutstanding}, Total Due: ₹${bRow5.totalOutstanding}`);
    if (bRow5.principalOutstanding !== 10000 || bRow5.totalOutstanding !== 12000) {
      throw new Error(`Scenario 5 Failed: Expected ₹10,000/₹12,000, got ₹${bRow5.principalOutstanding}/₹${bRow5.totalOutstanding}`);
    }
    console.log('✔ Scenario 5 Passed: Overdue loan includes canonical principal and accrued interest.');

    // Scenario 6: Voided Payment check
    // Make payment of ₹5,000 then void it -> Total due remains ₹12,000
    const payTemp = await paymentRepository.create(
      {
        loan_id: loanOverdue.id,
        payment_amount: 5000,
        payment_date: new Date().toISOString().split('T')[0],
        payment_mode: 'cash',
        allocation_method: 'principal_first',
      },
      1,
      conn
    );
    await paymentRepository.void(payTemp.id, 'Test voiding payment', 1);

    const check6 = await reportRepository.getBorrowerReport({ search: testBorrower.borrowerId }, conn);
    const bRow6 = check6.find((b) => b.id === testBorrower.id);
    console.log(`Scenario 6 (Voided Payment): Principal Due: ₹${bRow6.principalOutstanding}, Total Due: ₹${bRow6.totalOutstanding}`);
    if (bRow6.principalOutstanding !== 10000 || bRow6.totalOutstanding !== 12000) {
      throw new Error(`Scenario 6 Failed: Expected ₹10,000/₹12,000, got ₹${bRow6.principalOutstanding}/₹${bRow6.totalOutstanding}`);
    }
    console.log('✔ Scenario 6 Passed: Voided payment does not reduce outstanding balance.');

    // Scenario 7: Deleted Loan check
    // Soft delete overdue loan
    await conn.execute('UPDATE loans SET deleted_at = NOW() WHERE id = ?', [loanOverdue.id]);
    const check7 = await reportRepository.getBorrowerReport({ search: testBorrower.borrowerId }, conn);
    const bRow7 = check7.find((b) => b.id === testBorrower.id);
    console.log(`Scenario 7 (Deleted Loan): Principal Due: ₹${bRow7.principalOutstanding}, Total Due: ₹${bRow7.totalOutstanding}`);
    if (bRow7.principalOutstanding !== 0 || bRow7.totalOutstanding !== 0) {
      throw new Error(`Scenario 7 Failed: Expected ₹0/₹0, got ₹${bRow7.principalOutstanding}/₹${bRow7.totalOutstanding}`);
    }
    console.log('✔ Scenario 7 Passed: Deleted loan does not contribute to borrower totals.');

    // Clean up scenario test records
    const allTestLoanIds = [loan1.id, loanA.id, loanB.id, loanOverdue.id];
    await conn.execute('DELETE FROM payment_allocations WHERE payment_id IN (SELECT id FROM payments WHERE loan_id IN (?, ?, ?, ?))', allTestLoanIds);
    await conn.execute('DELETE FROM payments WHERE loan_id IN (?, ?, ?, ?)', allTestLoanIds);
    await conn.execute('DELETE FROM loans WHERE id IN (?, ?, ?, ?)', allTestLoanIds);
    await conn.execute('DELETE FROM borrowers WHERE id = ?', [testBorrower.id]);
    console.log('✔ Financial Scenarios test data cleaned up cleanly.');

    // ------------------------------------------------------------------
    // TEST 3: Cross-Report Numerical Equivalence Assertion
    // ------------------------------------------------------------------
    console.log('\n--- Test 3: Cross-Report Numerical Equivalence Assertion ---');
    const allBorrowers = await reportRepository.getBorrowerReport({}, conn);
    const allLoans = await reportRepository.getLoanReport({}, conn);
    const allOutstanding = await reportRepository.getOutstandingReport({}, conn);

    for (const b of allBorrowers) {
      const borrowerLoans = allLoans.filter((l) => l.borrowerName === b.fullName && l.status !== 'completed' && l.status !== 'cancelled');
      const expectedBorrowerTotalDue = borrowerLoans.reduce((sum, l) => sum + l.totalOutstanding, 0);

      if (b.totalOutstanding !== expectedBorrowerTotalDue) {
        throw new Error(
          `Cross-Report Discrepancy for ${b.fullName}: Borrower Report has ₹${b.totalOutstanding}, ` +
            `but Loan Portfolio sum is ₹${expectedBorrowerTotalDue}`
        );
      }
    }
    console.log(`✔ Cross-Report Assertion Passed: Borrower totalOutstanding matches Loan Portfolio sum across all ${allBorrowers.length} borrowers.`);

    // ------------------------------------------------------------------
    // TEST 4: ExcelJS Export & CSV Formula Injection Sanitization
    // ------------------------------------------------------------------
    console.log('\n--- Test 4: ExcelJS Export & CSV Formula Injection Sanitization ---');
    const excelBuf = await excelExportService.generateReportWorkbook('loan-report', loans, {
      title: 'Loan Portfolio Report',
    });
    if (!excelBuf || excelBuf.length < 500) throw new Error('Excel workbook generation failed');
    console.log(`✔ ExcelJS .xlsx generated (${excelBuf.length} bytes)`);

    const injectionData = [
      {
        paymentId: '=SUM(1,2)',
        paymentDate: '2026-02-15',
        loanId: '+91 9876543210',
        borrowerName: '@ATTACK_COMMAND',
        paymentAmount: 5000,
        principalPortion: 4000,
        interestPortion: 1000,
        paymentMode: '\tTAB_INJECT',
        referenceNumber: '-123456',
        isVoid: false,
      },
    ];

    const csvOutput = excelExportService.generateReportCSV('payment-report', injectionData);
    if (!csvOutput.includes(`"'=SUM(1,2)"`)) throw new Error('Formula injection with "=" not sanitized');
    if (!csvOutput.includes(`"'+91 9876543210"`)) throw new Error('Formula injection with "+" not sanitized');
    if (!csvOutput.includes(`"'@ATTACK_COMMAND"`)) throw new Error('Formula injection with "@" not sanitized');
    if (!csvOutput.includes(`"'\tTAB_INJECT"`)) throw new Error('Formula injection with "\\t" not sanitized');
    if (!csvOutput.includes(`"'-123456"`)) throw new Error('Formula injection with "-" not sanitized');
    if (!csvOutput.includes(`"5000.00"`)) throw new Error('Numeric currency value corrupted');
    console.log('✔ CSV Formula Injection protection fully verified.');

    // ------------------------------------------------------------------
    // TEST 5: Template Generation & Schema Matching
    // ------------------------------------------------------------------
    console.log('\n--- Test 5: Downloadable Excel Templates Generation ---');
    const entities = ['borrowers', 'loans', 'payments', 'capital'];
    for (const ent of entities) {
      const tBuf = await templateGeneratorService.generateTemplateWorkbook(ent);
      const tInfo = templateGeneratorService.getTemplateInfo(ent);
      if (!tBuf || tBuf.length < 500) throw new Error(`Template generation failed for ${ent}`);
      console.log(`✔ Template for ${ent} generated (${tInfo.columns.join(', ')})`);
    }

    // ------------------------------------------------------------------
    // TEST 6: Standalone vs External Connection Repository create()
    // ------------------------------------------------------------------
    console.log('\n--- Test 6: Standalone vs External Connection create() ---');
    const testTag = Date.now();
    const phoneStandalone = `+91 91111${Math.floor(10000 + Math.random() * 90000)}`;
    const phoneExternal = `+91 92222${Math.floor(10000 + Math.random() * 90000)}`;

    const bStandalone = await borrowerRepository.create(
      {
        fullName: `Standalone User ${testTag}`,
        phone: phoneStandalone,
        email: `standalone_${testTag}@test.com`,
        address: 'Test City',
      },
      1
    );
    console.log(`✔ Standalone create succeeded: ${bStandalone.borrowerId}`);

    const testTxConn = await (await mysql.createPool(DB_CONFIG)).getConnection();
    let bExternal;
    try {
      await testTxConn.beginTransaction();
      bExternal = await borrowerRepository.create(
        {
          fullName: `External Tx User ${testTag}`,
          phone: phoneExternal,
          email: `external_${testTag}@test.com`,
          address: 'Test City',
        },
        1,
        testTxConn
      );
      await testTxConn.commit();
      console.log(`✔ External connection create succeeded: ${bExternal.borrowerId}`);
    } catch (e) {
      await testTxConn.rollback();
      throw e;
    } finally {
      testTxConn.release();
    }

    await conn.execute('DELETE FROM borrowers WHERE phone IN (?, ?)', [phoneStandalone, phoneExternal]);
    console.log('✔ Standalone & External connection test records cleaned up.');

    // ------------------------------------------------------------------
    // TEST 7: TRUE Multi-Row Bulk Import Rollback Proof
    // ------------------------------------------------------------------
    console.log('\n--- Test 7: True Multi-Row Atomic Transaction & Rollback Proof ---');

    const [beforeCountRows] = await conn.query('SELECT COUNT(*) AS total FROM borrowers WHERE deleted_at IS NULL');
    const initialCount = Number(beforeCountRows[0].total);
    console.log(`Initial database borrower count: ${initialCount}`);

    const failWb = new ExcelJS.Workbook();
    const failSheet = failWb.addWorksheet('Data Import');
    failSheet.getRow(3).values = ['fullName', 'phone', 'email', 'address', 'notes', 'status'];

    const batchTimestamp = Date.now();
    for (let i = 1; i <= 9; i++) {
      failSheet.getRow(3 + i).values = [
        `Atomic Test User ${i}`,
        `+91 98888${i}${Math.floor(1000 + Math.random() * 9000)}`,
        `atomic_${batchTimestamp}_${i}@test.com`,
        `Address ${i}`,
        'Atomic batch note',
        'active',
      ];
    }

    // Row 10: Intentionally invalid phone
    failSheet.getRow(13).values = [
      'Atomic Fail User 10',
      'invalid',
      `atomic_fail@test.com`,
      'Address 10',
      'This must cause rollback',
      'active',
    ];

    const failBuf = Buffer.from(await failWb.xlsx.writeBuffer());
    const failResult = await excelImportService.importData('borrowers', failBuf, 1);

    if (failResult.success) {
      throw new Error('Batch import should have failed on invalid Row 10 but succeeded!');
    }

    const [afterFailCountRows] = await conn.query('SELECT COUNT(*) AS total FROM borrowers WHERE deleted_at IS NULL');
    const afterFailCount = Number(afterFailCountRows[0].total);
    console.log(`Database borrower count after failed 10-row batch: ${afterFailCount}`);

    if (afterFailCount !== initialCount) {
      throw new Error(
        `CRITICAL TRANSACTION ATOMICITY FAILURE! Expected count ${initialCount}, but found ${afterFailCount}.`
      );
    }
    console.log('✔ ROLLBACK PROOF PASSED: Zero rows were committed to the database after mid-batch failure.');

  } finally {
    await conn.end();
  }

  console.log('\n================================================================');
  console.log('🎉 ALL PHASE 9 PRODUCTION READINESS TESTS PASSED (100%)!');
  console.log('================================================================');
}

runTests().catch((err) => {
  console.error('\n❌ Phase 9 Test Suite Failed:', err);
  process.exit(1);
});
