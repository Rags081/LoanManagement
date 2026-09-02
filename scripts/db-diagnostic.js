import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logFile = path.resolve(__dirname, '../debug.log');

const logMessages = [];
function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  logMessages.push(line);
}

async function runDiagnostic() {
  log('==============================================');
  log('   LOAN MANAGEMENT SYSTEM - DB DIAGNOSTIC     ');
  log('==============================================');

  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'loan_management',
  };

  log(`Target: ${config.user}@${config.host}:${config.port}/${config.database}`);

  // Test 1: Connect to MySQL Server (without DB)
  log('Test 1: Connecting to MySQL server instance...');
  let rootConn;
  try {
    rootConn = await mysql.createConnection({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      connectTimeout: 5000,
    });
    log('✔ Connected to MySQL server successfully.');
  } catch (err) {
    log(`❌ FAILED to connect to MySQL server: ${err.code || err.message}`);
    log(`Details: ${err.message}`);
    if (err.code === 'ECONNREFUSED') {
      log('Suggestion: MySQL service is NOT running on port ' + config.port + '. Please start MySQL service.');
    } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      log('Suggestion: Access denied for user ' + config.user + '. Please check DB_PASSWORD in .env.');
    }
    fs.writeFileSync(logFile, logMessages.join('\n'), 'utf-8');
    return;
  }

  // Test 2: Check database existence
  log('Test 2: Checking database existence...');
  try {
    const [dbRows] = await rootConn.query(
      'SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?',
      [config.database]
    );
    if (dbRows.length === 0) {
      log(`❌ Database "${config.database}" DOES NOT EXIST.`);
      log('Suggestion: Run "npm run migrate" or "npm run db:setup" to create database.');
      await rootConn.end();
      fs.writeFileSync(logFile, logMessages.join('\n'), 'utf-8');
      return;
    } else {
      log(`✔ Database "${config.database}" exists.`);
    }
  } catch (err) {
    log(`❌ Error checking database schema: ${err.message}`);
    await rootConn.end();
    fs.writeFileSync(logFile, logMessages.join('\n'), 'utf-8');
    return;
  }
  await rootConn.end();

  // Test 3: Connect to target database
  log('Test 3: Connecting to target database...');
  let dbConn;
  try {
    dbConn = await mysql.createConnection(config);
    log('✔ Connected to target database successfully.');
  } catch (err) {
    log(`❌ Failed connecting to target database: ${err.message}`);
    fs.writeFileSync(logFile, logMessages.join('\n'), 'utf-8');
    return;
  }

  // Test 4: Check tables
  log('Test 4: Checking required tables...');
  try {
    const [tableRows] = await dbConn.query('SHOW TABLES');
    const tableNames = tableRows.map((r) => Object.values(r)[0]);
    log(`Found ${tableNames.length} table(s): ${tableNames.join(', ')}`);

    const requiredTables = ['users', 'borrowers', 'loans', 'payments', 'payment_allocations', 'capital_transactions', 'audit_logs', 'settings'];
    const missing = requiredTables.filter((t) => !tableNames.includes(t));
    if (missing.length > 0) {
      log(`❌ Missing tables: ${missing.join(', ')}`);
      log('Suggestion: Run "npm run migrate" to create missing tables.');
    } else {
      log('✔ All required tables exist.');
    }
  } catch (err) {
    log(`❌ Error listing tables: ${err.message}`);
  }

  // Test 5: Check admin user
  log('Test 5: Checking default administrator record...');
  try {
    const [userRows] = await dbConn.query(
      'SELECT id, email, full_name, role, is_active, LEFT(password_hash, 10) as hash_preview FROM users WHERE email = ?',
      ['admin@loanmanagement.com']
    );
    if (userRows.length === 0) {
      log('❌ Administrator account "admin@loanmanagement.com" was NOT found in users table.');
      log('Suggestion: Run "npm run seed" to insert default admin user.');
    } else {
      const user = userRows[0];
      log(`✔ Admin user found: ID ${user.id}, Role: ${user.role}, Active: ${user.is_active}, Hash: ${user.hash_preview}...`);
    }
  } catch (err) {
    log(`❌ Error querying users table: ${err.message}`);
  }

  await dbConn.end();
  log('==============================================');
  log('   DIAGNOSTIC FINISHED                        ');
  log('==============================================');

  fs.writeFileSync(logFile, logMessages.join('\n'), 'utf-8');
}

runDiagnostic().catch((err) => {
  log(`Fatal diagnostic error: ${err.message}`);
  fs.writeFileSync(logFile, logMessages.join('\n'), 'utf-8');
});
