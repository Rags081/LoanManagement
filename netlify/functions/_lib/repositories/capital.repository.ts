import { RowDataPacket, ResultSetHeader, PoolConnection } from 'mysql2/promise';
import { getPool, withTransaction } from '../database';
import { generateId } from '../id-generator';
import Decimal from 'decimal.js';

export interface DbCapitalTransaction extends RowDataPacket {
  id: number;
  transaction_id: string;
  transaction_date: string | Date;
  transaction_type: 'capital_given' | 'capital_returned' | 'adjustment';
  amount: number | string;
  source: string | null;
  destination: string | null;
  description: string | null;
  reference_number: string | null;
  notes: string | null;
  running_balance: number | string;
  created_by: number;
  creator_name?: string;
  created_at: Date | string;
  updated_at: Date | string;
  deleted_at: Date | string | null;
}

export interface CapitalCreateDto {
  transaction_id?: string;
  transactionId?: string;
  transaction_date?: string;
  transactionDate?: string;
  transaction_type?: 'capital_given' | 'capital_returned' | 'adjustment';
  transactionType?: 'capital_given' | 'capital_returned' | 'adjustment';
  amount: number | string;
  source?: string | null;
  destination?: string | null;
  description?: string | null;
  reference_number?: string | null;
  referenceNumber?: string | null;
  notes?: string | null;
}

export interface CapitalUpdateDto {
  transaction_date?: string;
  transactionDate?: string;
  transaction_type?: 'capital_given' | 'capital_returned' | 'adjustment';
  transactionType?: 'capital_given' | 'capital_returned' | 'adjustment';
  amount?: number | string;
  source?: string | null;
  destination?: string | null;
  description?: string | null;
  reference_number?: string | null;
  referenceNumber?: string | null;
  notes?: string | null;
}

export interface CapitalFilterOptions {
  transactionType?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CapitalBalance {
  totalGiven: number;
  totalReturned: number;
  currentBalance: number;
  transactionCount: number;
  lastUpdated: string;
}

export interface CapitalSummaryMonth {
  period: string;
  given: number;
  returned: number;
  netFlow: number;
}

interface CountRow extends RowDataPacket {
  total: number;
}

interface BalanceAggRow extends RowDataPacket {
  total_given: number | string | null;
  total_returned: number | string | null;
  tx_count: number;
}

interface MonthlyAggRow extends RowDataPacket {
  period: string;
  given: number | string | null;
  returned: number | string | null;
}

export interface MappedCapitalTransaction {
  id: number;
  transactionId: string;
  transaction_id: string;
  transactionDate: string;
  transaction_date: string;
  transactionType: 'capital_given' | 'capital_returned' | 'adjustment';
  transaction_type: 'capital_given' | 'capital_returned' | 'adjustment';
  amount: number;
  source: string | null;
  destination: string | null;
  description: string | null;
  referenceNumber: string | null;
  reference_number: string | null;
  notes: string | null;
  runningBalance: number;
  running_balance: number;
  createdBy: number;
  created_by: number;
  creatorName?: string;
  creator_name?: string;
  createdAt: string;
  created_at: string;
  updatedAt: string;
  updated_at: string;
  deletedAt: string | null;
  deleted_at: string | null;
}

export function mapDbToCapitalTransaction(row: DbCapitalTransaction): MappedCapitalTransaction {
  const rawDate = row.transaction_date;
  let dateStr: string;
  if (rawDate instanceof Date) {
    const year = rawDate.getFullYear();
    const month = String(rawDate.getMonth() + 1).padStart(2, '0');
    const day = String(rawDate.getDate()).padStart(2, '0');
    dateStr = `${year}-${month}-${day}`;
  } else if (typeof rawDate === 'string') {
    dateStr = rawDate.split('T')[0].split(' ')[0];
  } else {
    dateStr = String(rawDate);
  }

  return {
    id: row.id,
    transactionId: row.transaction_id,
    transaction_id: row.transaction_id,
    transactionDate: dateStr,
    transaction_date: dateStr,
    transactionType: row.transaction_type,
    transaction_type: row.transaction_type,
    amount: Number(row.amount),
    source: row.source,
    destination: row.destination,
    description: row.description,
    referenceNumber: row.reference_number,
    reference_number: row.reference_number,
    notes: row.notes,
    runningBalance: Number(row.running_balance),
    running_balance: Number(row.running_balance),
    createdBy: row.created_by,
    created_by: row.created_by,
    creatorName: row.creator_name,
    creator_name: row.creator_name,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    created_at: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at),
    updated_at: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at),
    deletedAt: row.deleted_at ? (row.deleted_at instanceof Date ? row.deleted_at.toISOString() : String(row.deleted_at)) : null,
    deleted_at: row.deleted_at ? (row.deleted_at instanceof Date ? row.deleted_at.toISOString() : String(row.deleted_at)) : null,
  };
}

export class CapitalRepository {
  async findById(id: number, connection?: PoolConnection): Promise<MappedCapitalTransaction | null> {
    const conn = connection || getPool();
    const sql = `
      SELECT c.*, u.full_name AS creator_name
      FROM capital_transactions c
      LEFT JOIN users u ON u.id = c.created_by
      WHERE c.id = ? AND c.deleted_at IS NULL
      LIMIT 1
    `;
    const [rows] = await conn.query<DbCapitalTransaction[]>(sql, [id]);
    return rows[0] ? mapDbToCapitalTransaction(rows[0]) : null;
  }

  async findByTransactionId(transactionId: string, connection?: PoolConnection): Promise<MappedCapitalTransaction | null> {
    const conn = connection || getPool();
    const sql = `
      SELECT c.*, u.full_name AS creator_name
      FROM capital_transactions c
      LEFT JOIN users u ON u.id = c.created_by
      WHERE c.transaction_id = ? AND c.deleted_at IS NULL
      LIMIT 1
    `;
    const [rows] = await conn.query<DbCapitalTransaction[]>(sql, [transactionId.trim()]);
    return rows[0] ? mapDbToCapitalTransaction(rows[0]) : null;
  }

  async findAll(
    filters: CapitalFilterOptions = {},
    connection?: PoolConnection
  ): Promise<{ data: MappedCapitalTransaction[]; total: number; page: number; limit: number; totalPages: number }> {
    const conn = connection || getPool();
    const conditions: string[] = ['c.deleted_at IS NULL'];
    const params: unknown[] = [];

    if (filters.transactionType && filters.transactionType !== 'all') {
      conditions.push('c.transaction_type = ?');
      params.push(filters.transactionType);
    }
    if (filters.startDate) {
      conditions.push('c.transaction_date >= ?');
      params.push(filters.startDate);
    }
    if (filters.endDate) {
      conditions.push('c.transaction_date <= ?');
      params.push(filters.endDate);
    }
    if (filters.search) {
      const pattern = `%${filters.search.trim()}%`;
      conditions.push(
        '(c.transaction_id LIKE ? OR c.description LIKE ? OR c.reference_number LIKE ? OR c.source LIKE ? OR c.destination LIKE ?)'
      );
      params.push(pattern, pattern, pattern, pattern, pattern);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    // Total Count
    const [countRows] = await conn.query<CountRow[]>(
      `SELECT COUNT(*) AS total FROM capital_transactions c ${whereClause}`,
      params
    );
    const total = countRows[0]?.total || 0;

    const page = Math.max(1, filters.page || 1);
    const limit = Math.max(1, filters.limit || 10);
    const offset = (page - 1) * limit;
    const totalPages = Math.ceil(total / limit) || 1;

    const sql = `
      SELECT c.*, u.full_name AS creator_name
      FROM capital_transactions c
      LEFT JOIN users u ON u.id = c.created_by
      ${whereClause}
      ORDER BY c.transaction_date DESC, c.id DESC
      LIMIT ? OFFSET ?
    `;

    const [rows] = await conn.query<DbCapitalTransaction[]>(sql, [...params, limit, offset]);
    const data = rows.map((r) => mapDbToCapitalTransaction(r));
    return { data, total, page, limit, totalPages };
  }

  async getCurrentRunningBalance(connection?: PoolConnection): Promise<number> {
    const conn = connection || getPool();
    const [rows] = await conn.query<RowDataPacket[]>(
      'SELECT running_balance FROM capital_transactions WHERE deleted_at IS NULL ORDER BY transaction_date DESC, id DESC LIMIT 1'
    );
    return rows[0]?.running_balance ? Number(rows[0].running_balance) : 0;
  }

  /**
   * Recalculates all running balances sequentially across the entire timeline
   */
  async recalculateRunningBalances(conn: PoolConnection): Promise<void> {
    const [rows] = await conn.query<DbCapitalTransaction[]>(
      'SELECT id, transaction_type, amount FROM capital_transactions WHERE deleted_at IS NULL ORDER BY transaction_date ASC, id ASC'
    );

    let currentBalance = new Decimal(0);
    for (const row of rows) {
      const amount = new Decimal(row.amount);
      if (row.transaction_type === 'capital_given') {
        currentBalance = currentBalance.plus(amount);
      } else if (row.transaction_type === 'capital_returned') {
        currentBalance = currentBalance.minus(amount);
      } else {
        // Adjustment: add as positive
        currentBalance = currentBalance.plus(amount);
      }

      if (currentBalance.lessThan(0)) {
        throw new Error(
          `Recalculation error: Capital running balance cannot drop below 0 (occurred at transaction #${row.id})`
        );
      }

      await conn.execute('UPDATE capital_transactions SET running_balance = ? WHERE id = ?', [
        currentBalance.toFixed(2),
        row.id,
      ]);
    }
  }

  async create(
    data: CapitalCreateDto,
    createdBy: number,
    connection?: PoolConnection
  ): Promise<DbCapitalTransaction> {
    if (!connection) {
      return withTransaction((conn) => this.create(data, createdBy, conn));
    }

    const conn = connection;
    const transactionId =
      data.transactionId ||
      data.transaction_id ||
      (await generateId('CAP', 'capital_transactions', 'transaction_id', conn));

    const txDate = data.transactionDate || data.transaction_date;
    if (!txDate) {
      throw new Error('Transaction date is required');
    }

    const txType = data.transactionType || data.transaction_type || 'capital_given';

    const txAmount = new Decimal(data.amount);
    if (txAmount.lessThanOrEqualTo(0)) {
      throw new Error('Transaction amount must be greater than 0');
    }

    const txSource = data.source ? String(data.source).trim() : null;
    const txDestination = data.destination ? String(data.destination).trim() : null;
    const txDescription = data.description ? String(data.description).trim() : null;
    const txReferenceNumber = data.referenceNumber || data.reference_number
      ? String(data.referenceNumber || data.reference_number).trim()
      : null;
    const txNotes = data.notes ? String(data.notes).trim() : null;

    // 1. Insert placeholder with 0 running balance
    const [res] = await conn.execute<ResultSetHeader>(
      `INSERT INTO capital_transactions (
        transaction_id, transaction_date, transaction_type, amount,
        source, destination, description, reference_number, notes,
        running_balance, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0.00, ?)`,
      [
        transactionId,
        txDate,
        txType,
        txAmount.toFixed(2),
        txSource,
        txDestination,
        txDescription,
        txReferenceNumber,
        txNotes,
        createdBy,
      ]
    );

    const insertedId = res.insertId;

    // 2. Recalculate full balance chain
    await this.recalculateRunningBalances(conn);

    // 3. Audit log
    await conn.execute(
      `INSERT INTO audit_logs (user_id, action, entity, entity_id, new_data)
       VALUES (?, 'CREATE', 'capital_transaction', ?, ?)`,
      [createdBy, String(insertedId), JSON.stringify({ ...data, transaction_id: transactionId })]
    );

    const created = await this.findById(insertedId, conn);
    if (!created) throw new Error('Failed to retrieve newly created capital transaction');
    return created;
  }

  async update(id: number, data: CapitalUpdateDto, updatedBy: number): Promise<DbCapitalTransaction> {
    return withTransaction(async (conn) => {
      const existing = await this.findById(id, conn);
      if (!existing) throw new Error(`Capital transaction #${id} not found`);

      const updates: string[] = [];
      const values: unknown[] = [];

      const txDate = data.transactionDate !== undefined ? data.transactionDate : data.transaction_date;
      if (txDate !== undefined) {
        updates.push('transaction_date = ?');
        values.push(txDate);
      }

      const txType = data.transactionType !== undefined ? data.transactionType : data.transaction_type;
      if (txType !== undefined) {
        updates.push('transaction_type = ?');
        values.push(txType);
      }

      if (data.amount !== undefined) {
        const amt = new Decimal(data.amount);
        if (amt.lessThanOrEqualTo(0)) throw new Error('Amount must be greater than 0');
        updates.push('amount = ?');
        values.push(amt.toFixed(2));
      }

      if (data.source !== undefined) {
        updates.push('source = ?');
        values.push(data.source ? String(data.source).trim() : null);
      }

      if (data.destination !== undefined) {
        updates.push('destination = ?');
        values.push(data.destination ? String(data.destination).trim() : null);
      }

      if (data.description !== undefined) {
        updates.push('description = ?');
        values.push(data.description ? String(data.description).trim() : null);
      }

      const refNum = data.referenceNumber !== undefined ? data.referenceNumber : data.reference_number;
      if (refNum !== undefined) {
        updates.push('reference_number = ?');
        values.push(refNum ? String(refNum).trim() : null);
      }

      if (data.notes !== undefined) {
        updates.push('notes = ?');
        values.push(data.notes ? String(data.notes).trim() : null);
      }

      if (updates.length > 0) {
        values.push(id);
        await conn.execute<ResultSetHeader>(
          `UPDATE capital_transactions SET ${updates.join(', ')} WHERE id = ? AND deleted_at IS NULL`,
          values
        );
      }

      // Recalculate balance chain
      await this.recalculateRunningBalances(conn);

      // Audit log
      await conn.execute(
        `INSERT INTO audit_logs (user_id, action, entity, entity_id, old_data, new_data)
         VALUES (?, 'UPDATE', 'capital_transaction', ?, ?, ?)`,
        [updatedBy, String(id), JSON.stringify(existing), JSON.stringify(data)]
      );

      const updated = await this.findById(id, conn);
      if (!updated) throw new Error(`Capital transaction #${id} not found after update`);
      return updated;
    });
  }

  async softDelete(id: number, deletedBy: number): Promise<void> {
    return withTransaction(async (conn) => {
      const existing = await this.findById(id, conn);
      if (!existing) throw new Error(`Capital transaction #${id} not found`);

      await conn.execute<ResultSetHeader>(
        'UPDATE capital_transactions SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND deleted_at IS NULL',
        [id]
      );

      // Recalculate balance chain after removal
      await this.recalculateRunningBalances(conn);

      // Audit log
      await conn.execute(
        `INSERT INTO audit_logs (user_id, action, entity, entity_id, old_data)
         VALUES (?, 'DELETE', 'capital_transaction', ?, ?)`,
        [deletedBy, String(id), JSON.stringify(existing)]
      );
    });
  }

  async getBalance(connection?: PoolConnection): Promise<CapitalBalance> {
    const conn = connection || getPool();

    const sql = `
      SELECT
        IFNULL(SUM(CASE WHEN transaction_type = 'capital_given' THEN amount ELSE 0 END), 0) AS total_given,
        IFNULL(SUM(CASE WHEN transaction_type = 'capital_returned' THEN amount ELSE 0 END), 0) AS total_returned,
        COUNT(id) AS tx_count
      FROM capital_transactions
      WHERE deleted_at IS NULL
    `;

    const [rows] = await conn.query<BalanceAggRow[]>(sql);
    const row = rows[0] || { total_given: 0, total_returned: 0, tx_count: 0 };

    const given = new Decimal(row.total_given || 0);
    const returned = new Decimal(row.total_returned || 0);
    const currentBalance = await this.getCurrentRunningBalance(conn);

    return {
      totalGiven: given.toNumber(),
      totalReturned: returned.toNumber(),
      currentBalance,
      transactionCount: Number(row.tx_count || 0),
      lastUpdated: new Date().toISOString(),
    };
  }

  async getSummary(year?: number, connection?: PoolConnection): Promise<CapitalSummaryMonth[]> {
    const conn = connection || getPool();
    const targetYear = year || new Date().getFullYear();

    const sql = `
      SELECT
        DATE_FORMAT(transaction_date, '%Y-%m') AS period,
        IFNULL(SUM(CASE WHEN transaction_type = 'capital_given' THEN amount ELSE 0 END), 0) AS given,
        IFNULL(SUM(CASE WHEN transaction_type = 'capital_returned' THEN amount ELSE 0 END), 0) AS returned
      FROM capital_transactions
      WHERE deleted_at IS NULL AND YEAR(transaction_date) = ?
      GROUP BY period
      ORDER BY period ASC
    `;

    const [rows] = await conn.query<MonthlyAggRow[]>(sql, [targetYear]);

    return rows.map((r) => {
      const g = new Decimal(r.given || 0);
      const ret = new Decimal(r.returned || 0);
      return {
        period: r.period,
        given: g.toNumber(),
        returned: ret.toNumber(),
        netFlow: g.minus(ret).toNumber(),
      };
    });
  }
}

export const capitalRepository = new CapitalRepository();
export default capitalRepository;
