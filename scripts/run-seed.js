import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

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

async function runSeed() {
  console.log('🌱 Starting database seeding...');
  let connection;

  try {
    connection = await mysql.createConnection(DB_CONFIG);

    const seedFile = path.resolve(__dirname, '../database/seeds/seed.sql');
    if (!fs.existsSync(seedFile)) {
      throw new Error(`Seed file not found at: ${seedFile}`);
    }

    console.log('  ▶ Seeding default admin user & baseline data...');
    const seedSql = fs.readFileSync(seedFile, 'utf-8');
    await connection.query(seedSql);

    // Double check that admin user password hash matches Admin@123
    const adminPassword = 'Admin@123';
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    await connection.query(
      'UPDATE users SET password_hash = ? WHERE email = ?',
      [passwordHash, 'admin@loanmanagement.com']
    );

    console.log('✅ Seed execution completed successfully!');
    console.log('👤 Default Admin Credentials:');
    console.log('   Email:    admin@loanmanagement.com');
    console.log('   Password: Admin@123');
  } catch (error) {
    console.error('❌ Seeding error:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

runSeed();
