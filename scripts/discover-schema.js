import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'loan_management'
  });
  
  const [tables] = await conn.query('SHOW TABLES');
  console.log('=== DISCOVERED MYSQL SCHEMA & ROW COUNTS ===');
  for (const t of tables) {
    const tableName = Object.values(t)[0];
    const [rows] = await conn.query(`SELECT COUNT(*) as count FROM \`${tableName}\``);
    console.log(`- ${tableName}: ${rows[0].count} rows`);
  }
  await conn.end();
}

main().catch(console.error);
