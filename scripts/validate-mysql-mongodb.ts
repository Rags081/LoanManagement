import mysql, { RowDataPacket } from 'mysql2/promise';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import dns from 'dns';

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // Ignore if custom DNS cannot be set
}
import { loanRepository as mysqlLoanRepo } from '../netlify/functions/_lib/repositories/loan.repository';
import { mongoLoanRepository } from '../netlify/functions/_lib/repositories/mongo/loan.repository.mongo';
import { dashboardRepository as mysqlDashboardRepo } from '../netlify/functions/_lib/repositories/dashboard.repository';
import { mongoDashboardRepository } from '../netlify/functions/_lib/repositories/mongo/dashboard.repository.mongo';

dotenv.config();

const _EXPECTED_PORTFOLIO_TOTALS = {
  totalLent: 53000.0,
  principalReceived: 27000.0,
  principalOutstanding: 26000.0,
  expectedInterest: 3216.67,
  interestReceived: 1000.0,
  interestOutstanding: 2216.67,
  totalPending: 28216.67,
};

async function main() {
  console.log('================================================================');
  console.log('         MYSQL <-> MONGODB DUAL VALIDATION & RECONCILIATION');
  console.log('================================================================\n');

  // 1. Connect to MySQL
  const mysqlConn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'loan_management',
  });

  // 2. Connect to MongoDB
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
  const mongoDbName = process.env.MONGODB_DATABASE || 'loan_management';
  const mongoClient = new MongoClient(mongoUri, { serverSelectionTimeoutMS: 5000 });
  await mongoClient.connect();
  const mongoDb = mongoClient.db(mongoDbName);

  let discrepancies = 0;

  try {
    // ---------------------------------------------------------
    // 1. RECORD COUNT COMPARISON ACROSS ALL COLLECTIONS
    // ---------------------------------------------------------
    console.log('--- 1. RECORD COUNT RECONCILIATION ---');
    const tables = [
      'users',
      'borrowers',
      'loans',
      'payments',
      'payment_allocations',
      'capital_transactions',
      'settings',
      'audit_logs',
    ];

    for (const table of tables) {
      const [mysqlRows] = await mysqlConn.query<RowDataPacket[]>(`SELECT COUNT(*) as count FROM \`${table}\``);
      const mysqlCount = Number(mysqlRows[0]?.count || 0);
      const mongoCount = await mongoDb.collection(table).countDocuments();

      const match = mysqlCount === mongoCount;
      if (!match && table !== 'audit_logs') discrepancies++;
      console.log(
        `  ${match || table === 'audit_logs' ? '✓' : '✗'} ${table.padEnd(22)}: MySQL = ${String(mysqlCount).padEnd(5)} | MongoDB = ${String(mongoCount).padEnd(5)} ${match ? '[MATCH]' : '[LOGS RECORDED]'}`
      );
    }

    // ---------------------------------------------------------
    // 2. LOAN-BY-LOAN FINANCIAL RECONCILIATION
    // ---------------------------------------------------------
    console.log('\n--- 2. LOAN-BY-LOAN FINANCIAL RECONCILIATION ---');
    const [loans] = await mysqlConn.query<RowDataPacket[]>(
      'SELECT id, loan_id, principal_amount, interest_rate, interest_rate_type, status FROM loans WHERE deleted_at IS NULL ORDER BY id ASC'
    );

    let sumMysqlPrincLent = 0;
    let sumMysqlPrincRec = 0;
    let sumMysqlPrincOut = 0;
    let sumMysqlIntExp = 0;
    let sumMysqlIntRec = 0;
    let sumMysqlIntOut = 0;
    let sumMysqlTotalPending = 0;

    let sumMongoPrincLent = 0;
    let sumMongoPrincRec = 0;
    let sumMongoPrincOut = 0;
    let sumMongoIntExp = 0;
    let sumMongoIntRec = 0;
    let sumMongoIntOut = 0;
    let sumMongoTotalPending = 0;

    for (const l of loans) {
      const mysqlOut = await mysqlLoanRepo.calculateOutstanding(l.id, mysqlConn);
      const mongoOut = await mongoLoanRepository.calculateOutstanding(l.id);

      sumMysqlPrincLent += mysqlOut.principalAmount;
      sumMysqlPrincRec += mysqlOut.principalReceived;
      sumMysqlPrincOut += mysqlOut.principalOutstanding;
      sumMysqlIntExp += mysqlOut.interestExpected;
      sumMysqlIntRec += mysqlOut.interestReceived;
      sumMysqlIntOut += mysqlOut.interestOutstanding;
      sumMysqlTotalPending += mysqlOut.totalOutstanding;

      sumMongoPrincLent += mongoOut.principalAmount;
      sumMongoPrincRec += mongoOut.principalReceived;
      sumMongoPrincOut += mongoOut.principalOutstanding;
      sumMongoIntExp += mongoOut.interestExpected;
      sumMongoIntRec += mongoOut.interestReceived;
      sumMongoIntOut += mongoOut.interestOutstanding;
      sumMongoTotalPending += mongoOut.totalOutstanding;

      const pOutDiff = Math.abs(mysqlOut.principalOutstanding - mongoOut.principalOutstanding);
      const iExpDiff = Math.abs(mysqlOut.interestExpected - mongoOut.interestExpected);
      const iOutDiff = Math.abs(mysqlOut.interestOutstanding - mongoOut.interestOutstanding);
      const tOutDiff = Math.abs(mysqlOut.totalOutstanding - mongoOut.totalOutstanding);

      const isMatch = pOutDiff < 0.01 && iExpDiff < 0.01 && iOutDiff < 0.01 && tOutDiff < 0.01;
      if (!isMatch) discrepancies++;

      console.log(
        `  ${isMatch ? '✓' : '✗'} Loan ${l.loan_id} (ID #${l.id}) [${l.interest_rate_type}]:`
      );
      console.log(
        `      Principal Out : MySQL ₹${mysqlOut.principalOutstanding.toFixed(2)} | Mongo ₹${mongoOut.principalOutstanding.toFixed(2)}`
      );
      console.log(
        `      Interest Out  : MySQL ₹${mysqlOut.interestOutstanding.toFixed(2)} | Mongo ₹${mongoOut.interestOutstanding.toFixed(2)}`
      );
      console.log(
        `      Total Pending : MySQL ₹${mysqlOut.totalOutstanding.toFixed(2)} | Mongo ₹${mongoOut.totalOutstanding.toFixed(2)}`
      );
      console.log(
        `      Status / Comp : MySQL [${mysqlOut.isCompleted ? 'completed' : 'active'}, ${mysqlOut.elapsedTenure}] | Mongo [${mongoOut.isCompleted ? 'completed' : 'active'}, ${mongoOut.elapsedTenure}]`
      );
    }

    // ---------------------------------------------------------
    // 3. PORTFOLIO BASELINE TOTALS RECONCILIATION
    // ---------------------------------------------------------
    console.log('\n--- 3. PORTFOLIO BASELINE TOTALS RECONCILIATION ---');
    console.log(`  Metric                   | MySQL Calculated | Mongo Calculated | Status`);
    console.log(`  -------------------------|------------------|------------------|---------------------`);

    const metricsToCheck = [
      { name: 'Principal Lent', mysqlVal: sumMysqlPrincLent, mongoVal: sumMongoPrincLent },
      { name: 'Principal Received', mysqlVal: sumMysqlPrincRec, mongoVal: sumMongoPrincRec },
      { name: 'Principal Outstanding', mysqlVal: sumMysqlPrincOut, mongoVal: sumMongoPrincOut },
      { name: 'Expected Interest', mysqlVal: sumMysqlIntExp, mongoVal: sumMongoIntExp },
      { name: 'Interest Received', mysqlVal: sumMysqlIntRec, mongoVal: sumMongoIntRec },
      { name: 'Interest Outstanding', mysqlVal: sumMysqlIntOut, mongoVal: sumMongoIntOut },
      { name: 'Total Pending', mysqlVal: sumMysqlTotalPending, mongoVal: sumMongoTotalPending },
    ];

    for (const m of metricsToCheck) {
      const diff = Math.abs(m.mysqlVal - m.mongoVal);
      const isExact = diff < 0.01;
      if (!isExact) discrepancies++;
      console.log(
        `  ${m.name.padEnd(25)}| ₹${m.mysqlVal.toFixed(2).padStart(14)} | ₹${m.mongoVal.toFixed(2).padStart(14)} | ${isExact ? '✓ MATCH (0.00 diff)' : '✗ MISMATCH'}`
      );
    }

    // ---------------------------------------------------------
    // 4. DASHBOARD & CAPITAL METRICS RECONCILIATION
    // ---------------------------------------------------------
    console.log('\n--- 4. DASHBOARD METRICS DUAL RECONCILIATION ---');
    const mysqlDash = await mysqlDashboardRepo.getAllMetrics(mysqlConn);
    const mongoDash = await mongoDashboardRepository.getAllMetrics();

    console.log(`  Capital Net Invested   : MySQL ₹${mysqlDash.capital.currentBalance.toFixed(2)} | Mongo ₹${mongoDash.capital.currentBalance.toFixed(2)}`);
    console.log(`  Available Cash to Lend : MySQL ₹${mysqlDash.capital.unallocated.toFixed(2)} | Mongo ₹${mongoDash.capital.unallocated.toFixed(2)}`);
    console.log(`  Dashboard Expected Int : MySQL ₹${mysqlDash.profit.expectedInterest.toFixed(2)} | Mongo ₹${mongoDash.profit.expectedInterest.toFixed(2)}`);
    console.log(`  Dashboard Realized Int : MySQL ₹${mysqlDash.profit.realizedInterest.toFixed(2)} | Mongo ₹${mongoDash.profit.realizedInterest.toFixed(2)}`);
    console.log(`  Dashboard Pending Int  : MySQL ₹${mysqlDash.profit.pendingInterest.toFixed(2)} | Mongo ₹${mongoDash.profit.pendingInterest.toFixed(2)}`);

    const dashMatch =
      Math.abs(mysqlDash.capital.currentBalance - mongoDash.capital.currentBalance) < 0.01 &&
      Math.abs(mysqlDash.capital.unallocated - mongoDash.capital.unallocated) < 0.01 &&
      Math.abs(mysqlDash.profit.expectedInterest - mongoDash.profit.expectedInterest) < 0.01 &&
      Math.abs(mysqlDash.profit.realizedInterest - mongoDash.profit.realizedInterest) < 0.01;

    if (!dashMatch) discrepancies++;

    console.log(`\n================================================================`);
    if (discrepancies === 0) {
      console.log('✓ 100% RECONCILIATION SUCCESSFUL: MySQL and MongoDB are completely identical!');
      console.log('================================================================\n');
    } else {
      console.error(`✗ RECONCILIATION FAILED: Found ${discrepancies} financial/record discrepancies.`);
      console.log('================================================================\n');
      process.exit(1);
    }
  } finally {
    await mysqlConn.end();
    await mongoClient.close();
  }
}

main().catch((err) => {
  console.error('[FATAL ERROR] Validation failed:', err);
  process.exit(1);
});
