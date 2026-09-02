import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'loan_management',
  multipleStatements: true,
};

async function runMigrations() {
  console.log('🚀 Starting database migrations...');
  console.log(`📡 Connecting to MySQL server at ${DB_CONFIG.host}:${DB_CONFIG.port}...`);

  let connection;
  try {
    // 1. Initial connection without database to ensure database exists
    const rootConn = await mysql.createConnection({
      host: DB_CONFIG.host,
      port: DB_CONFIG.port,
      user: DB_CONFIG.user,
      password: DB_CONFIG.password,
    });

    await rootConn.query(
      `CREATE DATABASE IF NOT EXISTS \`${DB_CONFIG.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
    );
    await rootConn.end();

    // 2. Connect to the target database
    connection = await mysql.createConnection(DB_CONFIG);

    // 3. Ensure schema_migrations table exists
    await connection.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL UNIQUE,
        batch INT NOT NULL,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 4. Get list of already applied migrations
    const [appliedRows] = await connection.query('SELECT name FROM schema_migrations');
    const appliedSet = new Set(appliedRows.map((r) => r.name));

    // 5. Read migration directory
    const migrationsDir = path.resolve(__dirname, '../database/migrations');
    if (!fs.existsSync(migrationsDir)) {
      throw new Error(`Migrations directory not found at: ${migrationsDir}`);
    }

    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    const pendingFiles = files.filter((f) => !appliedSet.has(f));

    if (pendingFiles.length === 0) {
      console.log('✅ All migrations are already up to date! Nothing to run.');
      return;
    }

    // Determine current batch number
    const [batchRows] = await connection.query(
      'SELECT IFNULL(MAX(batch), 0) + 1 AS next_batch FROM schema_migrations'
    );
    const nextBatch = batchRows[0].next_batch;

    console.log(`📦 Found ${pendingFiles.length} pending migration(s). Executing batch #${nextBatch}...`);

    for (const file of pendingFiles) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');

      console.log(`  ▶ Running migration: ${file}...`);
      await connection.beginTransaction();
      try {
        await connection.query(sql);
        await connection.query(
          'INSERT INTO schema_migrations (name, batch) VALUES (?, ?)',
          [file, nextBatch]
        );
        await connection.commit();
        console.log(`  ✔ Successfully applied: ${file}`);
      } catch (err) {
        await connection.rollback();
        console.error(`  ❌ Failed applying migration: ${file}`);
        throw err;
      }
    }

    console.log('🎉 All migrations completed successfully!');
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

runMigrations();
