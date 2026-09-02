import { PoolConnection, RowDataPacket } from 'mysql2/promise';
import { getPool } from './database';

interface LastIdRow extends RowDataPacket {
  max_num: number | null;
}

/**
 * Generates an atomic sequential identifier (e.g., BOR-001, LN-001, PAY-001, CAP-001).
 * Extracts the numeric portion after the hyphen and increments it.
 *
 * @param prefix Prefix string (e.g., "BOR", "LN", "PAY", "CAP")
 * @param table Target MySQL table name
 * @param column Column storing the formatted ID (e.g., "borrower_id", "loan_id")
 * @param connection Optional active transaction connection
 * @returns Formatted ID string (e.g., "BOR-001")
 */
export async function generateId(
  prefix: string,
  table: string,
  column: string,
  connection?: PoolConnection
): Promise<string> {
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

export default {
  generateId,
};
