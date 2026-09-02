import mysql, { RowDataPacket } from 'mysql2/promise';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import dns from 'dns';
import { toLocalDateString } from '../netlify/functions/_lib/financial-engine';

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // Ignore if custom DNS cannot be set
}

dotenv.config();

interface MigrationArgs {
  dryRun: boolean;
  reset: boolean;
}

function parseArgs(): MigrationArgs {
  const args = process.argv.slice(2);
  return {
    dryRun: args.includes('--dry-run'),
    reset: args.includes('--reset'),
  };
}

function maskUri(uri: string): string {
  try {
    return uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');
  } catch {
    return 'mongodb://[masked]';
  }
}

async function main() {
  const args = parseArgs();

  console.log('================================================================');
  console.log('         MYSQL -> MONGODB SCHEMA MIGRATION UTILITY');
  console.log('================================================================');
  console.log(`Mode: ${args.dryRun ? 'DRY-RUN (Inspection only, 0 writes)' : args.reset ? 'FULL MIGRATION WITH --reset' : 'STANDARD RUN'}`);
  console.log(`Source MySQL DB:   ${process.env.DB_NAME || 'loan_management'} @ ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 3306}`);
  console.log(`Target Mongo DB:   ${process.env.MONGODB_DATABASE || 'loan_management'} @ ${maskUri(process.env.MONGODB_URI || 'mongodb://localhost:27017')}\n`);

  // 1. Connect to MySQL
  const mysqlConn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'loan_management',
  });
  console.log('✓ Connected to MySQL database successfully.');

  // 2. Connect to MongoDB
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
  const mongoDbName = process.env.MONGODB_DATABASE || 'loan_management';
  const mongoClient = new MongoClient(mongoUri, { serverSelectionTimeoutMS: 5000 });
  await mongoClient.connect();
  const mongoDb = mongoClient.db(mongoDbName);
  console.log('✓ Connected to MongoDB database successfully.\n');

  try {
    // 3. Schema Discovery from MySQL
    const [tables] = await mysqlConn.query<RowDataPacket[]>('SHOW TABLES');
    const tableNames = tables.map((t) => Object.values(t)[0] as string);
    console.log(`Discovered ${tableNames.length} tables in MySQL: ${tableNames.join(', ')}\n`);

    // Tables to migrate in dependency order
    const migrationOrder = [
      'users',
      'borrowers',
      'loans',
      'payments',
      'payment_allocations',
      'capital_transactions',
      'settings',
      'audit_logs',
    ];

    // Read all records from MySQL
    const mysqlData: Record<string, RowDataPacket[]> = {};
    for (const table of migrationOrder) {
      if (tableNames.includes(table)) {
        const [rows] = await mysqlConn.query<RowDataPacket[]>(`SELECT * FROM \`${table}\``);
        mysqlData[table] = rows;
      } else {
        mysqlData[table] = [];
      }
    }

    // 4. Data Validation & Referential Integrity Checks
    console.log('--- 1. PRE-MIGRATION INSPECTION & INTEGRITY CHECKS ---');
    const userIds = new Set<number>(mysqlData.users.map((u) => Number(u.id)));
    const borrowerIds = new Set<number>(mysqlData.borrowers.map((b) => Number(b.id)));
    const loanIds = new Set<number>(mysqlData.loans.map((l) => Number(l.id)));
    const paymentIds = new Set<number>(mysqlData.payments.map((p) => Number(p.id)));

    let integrityErrors = 0;

    // Verify Borrowers -> Users
    for (const b of mysqlData.borrowers) {
      if (!userIds.has(Number(b.created_by))) {
        console.warn(`[WARNING] Borrower ${b.borrower_id} (ID #${b.id}) references missing user_id ${b.created_by}`);
        integrityErrors++;
      }
    }

    // Verify Loans -> Borrowers
    for (const l of mysqlData.loans) {
      if (!borrowerIds.has(Number(l.borrower_id))) {
        console.error(`[ERROR] Loan ${l.loan_id} (ID #${l.id}) references missing borrower_id ${l.borrower_id}`);
        integrityErrors++;
      }
    }

    // Verify Payments -> Loans
    for (const p of mysqlData.payments) {
      if (!loanIds.has(Number(p.loan_id))) {
        console.error(`[ERROR] Payment ${p.payment_id} (ID #${p.id}) references missing loan_id ${p.loan_id}`);
        integrityErrors++;
      }
    }

    // Verify Payment Allocations -> Payments
    for (const a of mysqlData.payment_allocations) {
      if (!paymentIds.has(Number(a.payment_id))) {
        console.error(`[ERROR] Payment Allocation ID #${a.id} references missing payment_id ${a.payment_id}`);
        integrityErrors++;
      }
    }

    console.log(`Integrity Check Result: ${integrityErrors === 0 ? '✓ All Foreign Key references 100% valid.' : `Found ${integrityErrors} warnings/errors.`}`);
    console.log('\nSource MySQL Record Counts:');
    for (const table of migrationOrder) {
      console.log(`  - ${table.padEnd(22)}: ${mysqlData[table]?.length || 0} rows`);
    }

    if (args.dryRun) {
      console.log('\n================================================================');
      console.log('   DRY-RUN COMPLETE: No changes were written to MongoDB.');
      console.log('   To perform migration, run: npx tsx scripts/migrate-mysql-to-mongodb.ts --reset');
      console.log('================================================================');
      return;
    }

    if (!args.reset) {
      // Check if target collections have existing data
      let existingCount = 0;
      for (const table of migrationOrder) {
        const c = await mongoDb.collection(table).countDocuments();
        existingCount += c;
      }
      if (existingCount > 0) {
        console.error('\n[ERROR] Target MongoDB collections already contain data.');
        console.error('To safely overwrite and re-migrate, you must explicitly provide the --reset flag:');
        console.error('  npx tsx scripts/migrate-mysql-to-mongodb.ts --reset\n');
        process.exit(1);
      }
    }

    // 5. Perform Migration
    console.log('\n--- 2. EXECUTING MIGRATION ---');

    for (const table of migrationOrder) {
      const collection = mongoDb.collection(table);

      if (args.reset) {
        await collection.deleteMany({});
        console.log(`✓ Cleared collection: ${table}`);
      }

      const rows = mysqlData[table] || [];
      if (rows.length === 0) {
        console.log(`- ${table}: 0 records to migrate.`);
        continue;
      }

      // Transform rows to clean typed documents
      const docs = rows.map((r) => {
        const doc: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(r)) {
          if (v === null || v === undefined) {
            doc[k] = null;
          } else if (k === 'id' || (k.endsWith('_id') && typeof v === 'number')) {
            doc[k] = Number(v);
          } else if (k === 'is_active' || k === 'is_void') {
            doc[k] = Boolean(v);
          } else if (
            k === 'principal_amount' ||
            k === 'interest_rate' ||
            k === 'total_expected_interest' ||
            k === 'total_expected_repayment' ||
            k === 'payment_amount' ||
            k === 'principal_portion' ||
            k === 'interest_portion' ||
            k === 'amount' ||
            k === 'running_balance' ||
            k === 'running_principal_balance' ||
            k === 'running_interest_balance'
          ) {
            doc[k] = Number(v);
          } else if (k === 'loan_given_date' || k === 'due_date' || k === 'settlement_date' || k === 'payment_date' || k === 'transaction_date') {
            doc[k] = toLocalDateString(v as string | Date);
          } else if (k.endsWith('_at') && v) {
            doc[k] = new Date(v as string | Date);
          } else if (k === 'old_data' || k === 'new_data') {
            try {
              doc[k] = typeof v === 'string' ? JSON.parse(v) : v;
            } catch {
              doc[k] = v;
            }
          } else {
            doc[k] = v;
          }
        }
        return doc;
      });

      await collection.insertMany(docs);
      console.log(`✓ Migrated ${docs.length} documents into MongoDB collection: ${table}`);
    }

    // 6. Ensure Indexes on MongoDB
    console.log('\n--- 3. CREATING MONGODB INDEXES ---');
    const { ensureMongoIndexes } = await import('../netlify/functions/_lib/db/mongodb');
    await ensureMongoIndexes(mongoDb);
    console.log('✓ All MongoDB unique and query indexes successfully verified and built.');

    console.log('\n================================================================');
    console.log('              MIGRATION SUCCESSFUL (MySQL -> MongoDB)');
    console.log('================================================================');
    console.log('Next Step: Run validation & financial reconciliation script:');
    console.log('  npx tsx scripts/validate-mysql-mongodb.ts\n');
  } finally {
    await mysqlConn.end();
    await mongoClient.close();
  }
}

main().catch((err) => {
  console.error('[FATAL ERROR] Migration failed:', err);
  process.exit(1);
});
