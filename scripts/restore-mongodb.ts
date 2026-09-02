import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import dns from 'dns';

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // Ignore
}

dotenv.config();

import { getMongoDb } from '../netlify/functions/_lib/db/mongodb';

async function main() {
  console.log('================================================================');
  console.log('     MONGODB ATLAS DISASTER RECOVERY & RESTORE UTILITY');
  console.log('================================================================\n');

  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');
  const targetFileArg = args.find((a) => a.endsWith('.json'));

  const backupDir = path.resolve(process.cwd(), 'backups');
  let backupFile = targetFileArg ? path.resolve(targetFileArg) : '';

  if (!backupFile) {
    if (!fs.existsSync(backupDir)) {
      throw new Error(`Backup directory not found at ${backupDir}`);
    }
    const mongoBackups = fs
      .readdirSync(backupDir)
      .filter((f) => f.startsWith('mongodb_backup_') && f.endsWith('.json'))
      .sort()
      .reverse();

    if (mongoBackups.length === 0) {
      throw new Error('No MongoDB backup files found in backups/ directory.');
    }
    backupFile = path.join(backupDir, mongoBackups[0]);
  }

  console.log(`Source File : ${backupFile}`);
  console.log(`Dry Run     : ${isDryRun ? 'YES (0 writes will be made)' : 'NO (Restoring to database)'}\n`);

  const fileContent = fs.readFileSync(backupFile, 'utf-8');
  const parsed = JSON.parse(fileContent);

  if (!parsed.collections || typeof parsed.collections !== 'object') {
    throw new Error('Invalid backup file format: missing "collections" object.');
  }

  console.log('Backup Metadata:');
  console.log(`  Database      : ${parsed.metadata?.database || 'unknown'}`);
  console.log(`  Created At    : ${parsed.metadata?.createdAt || 'unknown'}`);
  console.log(`  Total Docs    : ${parsed.metadata?.totalDocuments || 'unknown'}\n`);

  if (isDryRun) {
    console.log('--- DRY RUN VERIFICATION ---');
    for (const [colName, docs] of Object.entries(parsed.collections)) {
      const docList = docs as unknown[];
      console.log(`  ✓ Collection \`${colName.padEnd(22)}\`: ${String(docList.length).padStart(4)} documents ready`);
    }
    console.log('\n✓ Dry run completed. Re-run without `--dry-run` to execute restore.\n');
    return;
  }

  const db = await getMongoDb();

  console.log('--- RESTORING COLLECTIONS ---');
  for (const [colName, docs] of Object.entries(parsed.collections)) {
    const docList = docs as Record<string, unknown>[];
    const collection = db.collection(colName);

    // Clear existing
    await collection.deleteMany({});

    if (docList.length > 0) {
      // Fix ObjectIds / Dates
      const cleaned = docList.map((doc) => {
        const item = { ...doc };
        if (item.created_at && typeof item.created_at === 'string') {
          item.created_at = new Date(item.created_at);
        }
        if (item.updated_at && typeof item.updated_at === 'string') {
          item.updated_at = new Date(item.updated_at);
        }
        if (item.deleted_at && typeof item.deleted_at === 'string') {
          item.deleted_at = new Date(item.deleted_at);
        }
        return item;
      });

      await collection.insertMany(cleaned);
      console.log(`  ✓ Restored \`${colName.padEnd(22)}\`: ${String(cleaned.length).padStart(4)} documents`);
    } else {
      console.log(`  ✓ Restored \`${colName.padEnd(22)}\`:    0 documents (empty collection)`);
    }
  }

  console.log('\n================================================================');
  console.log('✓ MONGODB ATLAS DATABASE RESTORE COMPLETED SUCCESSFULLY');
  console.log('================================================================\n');
  process.exit(0);
}

main().catch((err) => {
  console.error('[FATAL ERROR] MongoDB restore failed:', err);
  process.exit(1);
});
