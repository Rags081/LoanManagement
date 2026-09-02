import { PoolConnection, RowDataPacket } from 'mysql2/promise';
import { getPool } from './database';
import { getDbDriver } from './db/config';
import { getMongoDb } from './db/mongodb';

interface LastIdRow extends RowDataPacket {
  max_num: number | null;
}

/**
 * Generates an atomic sequential identifier (e.g., BOR-001, LN-001, PAY-001, CAP-001).
 * Extracts the numeric portion after the hyphen and increments it.
 *
 * @param prefix Prefix string (e.g., "BOR", "LN", "PAY", "CAP")
 * @param table Target table/collection name
 * @param column Column/field storing the formatted ID (e.g., "borrower_id", "loan_id")
 * @param connection Optional active MySQL transaction connection
 * @returns Formatted ID string (e.g., "BOR-001")
 */
export async function generateId(
  prefix: string,
  table: string,
  column: string,
  connection?: PoolConnection
): Promise<string> {
  const driver = getDbDriver();

  if (driver === 'mongodb') {
    const db = await getMongoDb();
    const regex = new RegExp(`^${prefix}-\\d+`);
    const docs = await db
      .collection(table)
      .find({ [column]: { $regex: regex } })
      .project({ [column]: 1 })
      .toArray();

    let maxNum = 0;
    for (const doc of docs) {
      const val = (doc as Record<string, unknown>)[column];
      if (typeof val === 'string') {
        const parts = val.split('-');
        const num = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }
    const nextSeq = maxNum + 1;
    return `${prefix}-${String(nextSeq).padStart(3, '0')}`;
  }

  // Validate table and column names to prevent SQL injection in identifier positions
  const safeIdentifier = /^[a-zA-Z0-9_]+$/;
  if (!safeIdentifier.test(table) || !safeIdentifier.test(column)) {
    throw new Error(`Invalid table or column identifier: ${table}.${column}`);
  }

  const sql = `
    SELECT MAX(CAST(SUBSTRING_INDEX(${column}, '-', -1) AS UNSIGNED)) AS max_num
    FROM ${table}
    WHERE ${column} LIKE CONCAT(?, '-%')
  `;

  let rows: LastIdRow[];
  if (connection) {
    const [res] = await connection.query<LastIdRow[]>(sql, [prefix]);
    rows = res;
  } else {
    const pool = getPool();
    const [res] = await pool.query<LastIdRow[]>(sql, [prefix]);
    rows = res;
  }

  const currentMax = rows[0]?.max_num || 0;
  const nextSeq = currentMax + 1;

  // Format with minimum 3-digit zero padding
  return `${prefix}-${String(nextSeq).padStart(3, '0')}`;
}

/**
 * Generates the next sequential integer ID for MongoDB collections (matching MySQL auto_increment).
 */
export async function generateNumericId(collectionName: string): Promise<number> {
  const db = await getMongoDb();
  const docs = await db
    .collection(collectionName)
    .find({ id: { $exists: true, $type: 'number' } })
    .sort({ id: -1 })
    .limit(1)
    .toArray();

  const maxId = docs[0]?.id ? Number(docs[0].id) : 0;
  return maxId + 1;
}

export default {
  generateId,
  generateNumericId,
};
