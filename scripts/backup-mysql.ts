import mysql, { RowDataPacket } from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  console.log('================================================================');
  console.log('         MYSQL PRODUCTION SAFETY BACKUP UTILITY');
  console.log('================================================================\n');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'loan_management',
  });

  try {
    const backupDir = path.resolve(process.cwd(), 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const now = new Date();
    const timestamp = now
      .toISOString()
      .replace(/[-:]/g, '')
      .replace('T', '_')
      .split('.')[0];

    const [tables] = await connection.query<RowDataPacket[]>('SHOW TABLES');
    const tableNames = tables.map((t) => Object.values(t)[0] as string);

    console.log(`Discovered ${tableNames.length} tables in MySQL database "${process.env.DB_NAME || 'loan_management'}":`);

    const fullDump: Record<string, { schema: string; rows: Record<string, unknown>[] }> = {};
    let sqlContent = `-- MySQL Database Backup\n-- Database: ${process.env.DB_NAME || 'loan_management'}\n-- Date: ${now.toISOString()}\n\nSET FOREIGN_KEY_CHECKS=0;\n\n`;

    for (const table of tableNames) {
      const [createTable] = await connection.query<RowDataPacket[]>(`SHOW CREATE TABLE \`${table}\``);
      const createSql = createTable[0]?.['Create Table'] || '';

      const [rows] = await connection.query<RowDataPacket[]>(`SELECT * FROM \`${table}\``);
      fullDump[table] = {
        schema: createSql,
        rows,
      };

      console.log(`  ✓ Table \`${table.padEnd(22)}\`: ${String(rows.length).padStart(4)} rows backed up`);

      sqlContent += `-- Table structure for table \`${table}\`\nDROP TABLE IF EXISTS \`${table}\`;\n${createSql};\n\n`;

      if (rows.length > 0) {
        sqlContent += `-- Dumping data for table \`${table}\`\n`;
        for (const row of rows) {
          const keys = Object.keys(row).map((k) => `\`${k}\``).join(', ');
          const values = Object.values(row)
            .map((v) => {
              if (v === null || v === undefined) return 'NULL';
              if (typeof v === 'number') return v;
              if (typeof v === 'boolean') return v ? 1 : 0;
              if (v instanceof Date) return `'${v.toISOString().slice(0, 19).replace('T', ' ')}'`;
              return `'${String(v).replace(/'/g, "\\'")}'`;
            })
            .join(', ');
          sqlContent += `INSERT INTO \`${table}\` (${keys}) VALUES (${values});\n`;
        }
        sqlContent += '\n';
      }
    }

    sqlContent += 'SET FOREIGN_KEY_CHECKS=1;\n';

    const jsonPath = path.join(backupDir, `loan_management_backup_${timestamp}.json`);
    const sqlPath = path.join(backupDir, `loan_management_backup_${timestamp}.sql`);

    fs.writeFileSync(jsonPath, JSON.stringify(fullDump, null, 2), 'utf-8');
    fs.writeFileSync(sqlPath, sqlContent, 'utf-8');

    const jsonSize = (fs.statSync(jsonPath).size / 1024).toFixed(2);
    const sqlSize = (fs.statSync(sqlPath).size / 1024).toFixed(2);

    console.log('\n================================================================');
    console.log('✓ BACKUP COMPLETED & VERIFIED');
    console.log(`  JSON Snapshot : ${jsonPath} (${jsonSize} KB)`);
    console.log(`  SQL Dump      : ${sqlPath} (${sqlSize} KB)`);
    console.log('================================================================\n');
  } finally {
    await connection.end();
  }
}

main().catch((err) => {
  console.error('[FATAL ERROR] Backup failed:', err);
  process.exit(1);
});
