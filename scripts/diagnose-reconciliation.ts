import mysql, { RowDataPacket } from 'mysql2/promise';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import dns from 'dns';

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // Ignore
}

dotenv.config();

import { loanRepository as mysqlLoanRepo } from '../netlify/functions/_lib/repositories/loan.repository';
import { mongoLoanRepository } from '../netlify/functions/_lib/repositories/mongo/loan.repository.mongo';
import {
  calculateCalendarTenure,
  calculateLoanFinancials,
  toLocalDateString,
  NormalizedLoanData,
  NormalizedPaymentData,
} from '../netlify/functions/_lib/financial-engine';

async function main() {
  console.log('================================================================');
  console.log('       DIAGNOSTIC: LOAN-BY-LOAN FINANCIAL RECONCILIATION');
  console.log('================================================================\n');

  const mysqlConn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'loan_management',
  });

  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
  const mongoDbName = process.env.MONGODB_DATABASE || 'loan_management';
  const mongoClient = new MongoClient(mongoUri, { serverSelectionTimeoutMS: 5000 });
  await mongoClient.connect();
  const mongoDb = mongoClient.db(mongoDbName);

  try {
    const [mysqlLoans] = await mysqlConn.query<RowDataPacket[]>(
      'SELECT * FROM loans WHERE deleted_at IS NULL ORDER BY id ASC'
    );
    const mongoLoans = await mongoDb.collection('loans').find({ deleted_at: null }).sort({ id: 1 }).toArray();

    console.log(`Discovered ${mysqlLoans.length} MySQL loans and ${mongoLoans.length} MongoDB loans.\n`);

    console.log('| Loan | MySQL Exp Int | Mongo Exp Int | Diff | MySQL Int Out | Mongo Int Out | Diff |');
    console.log('|------|--------------:|--------------:|-----:|--------------:|--------------:|-----:|');

    let totalMysqlExp = 0;
    let totalMongoExp = 0;
    let totalMysqlOut = 0;
    let totalMongoOut = 0;

    for (const mLoan of mysqlLoans) {
      const mysqlOut = await mysqlLoanRepo.calculateOutstanding(mLoan.id, mysqlConn);
      const mongoOut = await mongoLoanRepository.calculateOutstanding(mLoan.id);

      totalMysqlExp += mysqlOut.interestExpected;
      totalMongoExp += mongoOut.interestExpected;
      totalMysqlOut += mysqlOut.interestOutstanding;
      totalMongoOut += mongoOut.interestOutstanding;

      const expDiff = Math.abs(mysqlOut.interestExpected - mongoOut.interestExpected);
      const outDiff = Math.abs(mysqlOut.interestOutstanding - mongoOut.interestOutstanding);

      console.log(
        `| ${mLoan.loan_id.padEnd(5)} | ₹${mysqlOut.interestExpected.toFixed(2).padStart(12)} | ₹${mongoOut.interestExpected.toFixed(2).padStart(12)} | ₹${expDiff.toFixed(2).padStart(3)} | ₹${mysqlOut.interestOutstanding.toFixed(2).padStart(12)} | ₹${mongoOut.interestOutstanding.toFixed(2).padStart(12)} | ₹${outDiff.toFixed(2).padStart(3)} |`
      );
    }

    const totalExpDiff = Math.abs(totalMysqlExp - totalMongoExp);
    const totalOutDiff = Math.abs(totalMysqlOut - totalMongoOut);
    console.log(
      `| TOTAL | ₹${totalMysqlExp.toFixed(2).padStart(12)} | ₹${totalMongoExp.toFixed(2).padStart(12)} | ₹${totalExpDiff.toFixed(2).padStart(3)} | ₹${totalMysqlOut.toFixed(2).padStart(12)} | ₹${totalMongoOut.toFixed(2).padStart(12)} | ₹${totalOutDiff.toFixed(2).padStart(3)} |`
    );

    console.log('\n================================================================');
    console.log('         DETAILED LOAN-BY-LOAN DATE & TENURE TRACE');
    console.log('================================================================');

    for (const mLoan of mysqlLoans) {
      const gLoan = mongoLoans.find((l) => l.id === mLoan.id);
      const [payments] = await mysqlConn.query<RowDataPacket[]>(
        'SELECT * FROM payments WHERE loan_id = ? AND is_void = 0 ORDER BY payment_date ASC',
        [mLoan.id]
      );

      const today = new Date();
      const todayStr = toLocalDateString(today);
      const loanGivenStr = toLocalDateString(mLoan.loan_given_date);
      const endDateStr = mLoan.status === 'completed' && mLoan.settlement_date ? toLocalDateString(mLoan.settlement_date) : todayStr;

      const tenure = calculateCalendarTenure(loanGivenStr, endDateStr);
      const calc = calculateLoanFinancials(
        mLoan as unknown as NormalizedLoanData,
        payments as unknown as NormalizedPaymentData[]
      );

      console.log(`\n--- Loan: ${mLoan.loan_id} (ID: ${mLoan.id}) ---`);
      console.log(`  Disbursed Date          : ${loanGivenStr}`);
      console.log(`  Effective End Date      : ${endDateStr}`);
      console.log(`  Raw MySQL Date          : ${mLoan.loan_given_date}`);
      console.log(`  Raw Mongo Date          : ${gLoan?.loan_given_date}`);
      console.log(`  Normalized MySQL Date   : ${toLocalDateString(mLoan.loan_given_date)}`);
      console.log(`  Normalized Mongo Date   : ${toLocalDateString(gLoan?.loan_given_date)}`);
      console.log(`  Status                  : ${mLoan.status}`);
      console.log(`  Settlement Date         : ${mLoan.settlement_date || 'null'}`);
      console.log(`  Calendar Tenure         : ${tenure.formatted} (${tenure.totalDays} total days)`);
      console.log(`  Completed Months        : ${tenure.years * 12 + tenure.months}`);
      console.log(`  Remaining Days          : ${tenure.days}`);
      console.log(`  Active Principal        : ₹${calc.principalOutstanding}`);
      console.log(`  Interest Rate           : ${mLoan.interest_rate}% (${mLoan.interest_rate_type})`);
      console.log(`  Interest Expected       : ₹${calc.interestExpected}`);
      console.log(`  Interest Paid           : ₹${calc.interestReceived}`);
      console.log(`  Interest Outstanding    : ₹${calc.interestOutstanding}`);
    }

  } finally {
    await mysqlConn.end();
    await mongoClient.close();
  }
}

main().catch((err) => {
  console.error('[FATAL ERROR]', err);
  process.exit(1);
});
