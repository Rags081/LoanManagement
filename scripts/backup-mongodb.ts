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

import { getMongoDb, MONGO_COLLECTIONS } from '../netlify/functions/_lib/db/mongodb';

async function main() {
  console.log('================================================================');
  console.log('        MONGODB ATLAS PRODUCTION BACKUP UTILITY');
  console.log('================================================================\n');

  const db = await getMongoDb();
  const dbName = process.env.MONGODB_DATABASE || 'ragscapital';

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

  const backupFile = path.join(backupDir, `mongodb_backup_${timestamp}.json`);

  console.log(`Target Database : ${dbName}`);
  console.log(`Backup File     : ${backupFile}\n`);

  const collections = Object.values(MONGO_COLLECTIONS);
  const dumpData: Record<string, unknown[]> = {};
  let totalDocs = 0;

  for (const colName of collections) {
    const docs = await db.collection(colName).find({}).toArray();
    dumpData[colName] = docs;
    totalDocs += docs.length;
    console.log(`  ✓ Collection \`${colName.padEnd(22)}\`: ${String(docs.length).padStart(4)} documents`);
  }

  const payload = {
    metadata: {
      database: dbName,
      createdAt: now.toISOString(),
      driver: 'mongodb',
      totalCollections: collections.length,
      totalDocuments: totalDocs,
    },
    collections: dumpData,
  };

  fs.writeFileSync(backupFile, JSON.stringify(payload, null, 2), 'utf-8');
  const stats = fs.statSync(backupFile);

  console.log('\n----------------------------------------------------------------');
  console.log(`✓ Backup successfully saved: ${(stats.size / 1024).toFixed(2)} KB`);
  console.log(`✓ Total documents backed up : ${totalDocs}`);
  console.log('================================================================\n');
  process.exit(0);
}

main().catch((err) => {
  console.error('[FATAL ERROR] MongoDB backup failed:', err);
  process.exit(1);
});
