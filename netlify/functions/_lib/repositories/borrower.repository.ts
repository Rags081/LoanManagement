import { RowDataPacket, ResultSetHeader, PoolConnection } from 'mysql2/promise';
import { getPool, withTransaction } from '../database';
import { generateId } from '../id-generator';
import Decimal from 'decimal.js';

export interface DbBorrower extends RowDataPacket {
  id: number;
  borrower_id: string;
  full_name: string;
  phone: string;
  email: string | null;
  address: string | null;
  notes: string | null;
  status: 'active' | 'inactive' | 'blacklisted';
  created_by: number;
  creator_name?: string;
  created_at: Date | string;
  updated_at: Date | string;
  deleted_at: Date | string | null;
}

export interface MappedBorrower {
  id: number;
  borrowerId: string;
  borrower_id: string;
  fullName: string;
  full_name: string;
  phone: string;
  email: string | null;
  address: string | null;
  notes: string | null;
  status: 'active' | 'inactive' | 'blacklisted';
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

export interface BorrowerCreateDto {
  borrower_id?: string;
  borrowerId?: string;
  full_name?: string;
  fullName?: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
  status?: 'active' | 'inactive' | 'blacklisted';
}

export interface BorrowerUpdateDto {
  full_name?: string;
  fullName?: string;
  phone?: string;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
  status?: 'active' | 'inactive' | 'blacklisted';
}

export interface BorrowerFilterOptions {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface BorrowerStats {
  totalLoans: number;
  activeLoans: number;
  completedLoans: number;
  totalPrincipalBorrowed: number;
  totalPrincipalRepaid: number;
  totalInterestPaid: number;
  totalOutstanding: number;
}

export interface BorrowerLoanSummary {
  id: number;
  loanId: string;
  principalAmount: number;
  interestRate: number;
  interestRateType: 'monthly' | 'daily' | 'flat';
  tenure: number;
  tenureUnit: 'days' | 'months' | 'years';
  loanGivenDate: string;
  dueDate: string;
  totalExpectedRepayment: number;
  status: 'active' | 'overdue' | 'completed' | 'cancelled';
  totalPaid: number;
  outstandingBalance: number;
  createdAt: string;
}

interface CountRow extends RowDataPacket {
  total: number;
}

export function mapDbToBorrower(row: DbBorrower): MappedBorrower {
  return {
    id: row.id,
    borrowerId: row.borrower_id,
    borrower_id: row.borrower_id,
    fullName: row.full_name,
    full_name: row.full_name,
    phone: row.phone,
    email: row.email,
    address: row.address,
    notes: row.notes,
    status: row.status,
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

export class BorrowerRepository {
  async findById(id: number, connection?: PoolConnection): Promise<MappedBorrower | null> {
    const conn = connection || getPool();
    const sql = `
      SELECT b.*, u.full_name AS creator_name
      FROM borrowers b
      LEFT JOIN users u ON u.id = b.created_by
      WHERE b.id = ? AND b.deleted_at IS NULL
      LIMIT 1
    `;
    const [rows] = await conn.query<DbBorrower[]>(sql, [id]);
    return rows[0] ? mapDbToBorrower(rows[0]) : null;
  }

  async findByBorrowerId(borrowerId: string, connection?: PoolConnection): Promise<MappedBorrower | null> {
    const conn = connection || getPool();
    const sql = `
      SELECT b.*, u.full_name AS creator_name
      FROM borrowers b
      LEFT JOIN users u ON u.id = b.created_by
      WHERE b.borrower_id = ? AND b.deleted_at IS NULL
      LIMIT 1
    `;
    const [rows] = await conn.query<DbBorrower[]>(sql, [borrowerId.trim()]);
    return rows[0] ? mapDbToBorrower(rows[0]) : null;
  }

  async findByPhone(phone: string, excludeId?: number, connection?: PoolConnection): Promise<MappedBorrower | null> {
    const conn = connection || getPool();
    let sql = 'SELECT b.* FROM borrowers b WHERE b.phone = ? AND b.deleted_at IS NULL';
    const params: unknown[] = [phone.trim()];

    if (excludeId !== undefined) {
      sql += ' AND b.id != ?';
      params.push(excludeId);
    }
    sql += ' LIMIT 1';

    const [rows] = await conn.query<DbBorrower[]>(sql, params);
    return rows[0] ? mapDbToBorrower(rows[0]) : null;
  }

  async findAll(
    filters: BorrowerFilterOptions = {},
    connection?: PoolConnection
  ): Promise<{ data: MappedBorrower[]; total: number; page: number; limit: number; totalPages: number }> {
    const conn = connection || getPool();
    const conditions: string[] = ['b.deleted_at IS NULL'];
    const params: unknown[] = [];

    if (filters.status && filters.status !== 'all') {
      conditions.push('b.status = ?');
      params.push(filters.status);
    }

    if (filters.search) {
      const pattern = `%${filters.search.trim()}%`;
      conditions.push('(b.borrower_id LIKE ? OR b.full_name LIKE ? OR b.phone LIKE ? OR b.email LIKE ?)');
      params.push(pattern, pattern, pattern, pattern);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const [countRows] = await conn.query<CountRow[]>(
      `SELECT COUNT(*) AS total FROM borrowers b ${whereClause}`,
      params
    );
    const total = countRows[0]?.total || 0;

    const page = Math.max(1, filters.page || 1);
    const limit = Math.max(1, filters.limit || 10);
    const offset = (page - 1) * limit;
    const totalPages = Math.ceil(total / limit) || 1;

    const sql = `
      SELECT b.*, u.full_name AS creator_name
      FROM borrowers b
      LEFT JOIN users u ON u.id = b.created_by
      ${whereClause}
      ORDER BY b.id DESC
      LIMIT ? OFFSET ?
    `;

    const [rows] = await conn.query<DbBorrower[]>(sql, [...params, limit, offset]);
    const data = rows.map((r) => mapDbToBorrower(r));
    return { data, total, page, limit, totalPages };
  }

  async search(queryText: string, limit = 10, connection?: PoolConnection): Promise<MappedBorrower[]> {
    const conn = connection || getPool();
    const pattern = `%${queryText.trim()}%`;
    const sql = `
      SELECT b.*, u.full_name AS creator_name
      FROM borrowers b
      LEFT JOIN users u ON u.id = b.created_by
      WHERE b.deleted_at IS NULL AND (b.borrower_id LIKE ? OR b.full_name LIKE ? OR b.phone LIKE ?)
      ORDER BY b.full_name ASC
      LIMIT ?
    `;
    const [rows] = await conn.query<DbBorrower[]>(sql, [pattern, pattern, pattern, limit]);
    return rows.map((r) => mapDbToBorrower(r));
  }

  async create(
    data: BorrowerCreateDto,
    createdBy: number,
    connection?: PoolConnection
  ): Promise<MappedBorrower> {
    if (!connection) {
      return withTransaction((conn) => this.create(data, createdBy, conn));
    }

    const conn = connection;
    const phone = data.phone.trim();
    const existing = await this.findByPhone(phone, undefined, conn);
    if (existing) {
      throw new Error(`Phone number "${phone}" is already registered to ${existing.fullName} (${existing.borrowerId})`);
    }

    const borrowerId =
      data.borrowerId ||
      data.borrower_id ||
      (await generateId('BOR', 'borrowers', 'borrower_id', conn));

    const fullName = (data.fullName || data.full_name || '').trim();
    if (!fullName) {
      throw new Error('Borrower full name is required');
    }

    const email = data.email ? String(data.email).trim() : null;
    const address = data.address ? String(data.address).trim() : null;
    const notes = data.notes ? String(data.notes).trim() : null;
    const status = data.status || 'active';

    const [res] = await conn.execute<ResultSetHeader>(
      `INSERT INTO borrowers (
        borrower_id, full_name, phone, email, address, notes, status, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [borrowerId, fullName, phone, email, address, notes, status, createdBy]
    );

    const insertedId = res.insertId;

    // Audit log
    await conn.execute(
      `INSERT INTO audit_logs (user_id, action, entity, entity_id, new_data)
       VALUES (?, 'CREATE', 'borrower', ?, ?)`,
      [createdBy, String(insertedId), JSON.stringify({ ...data, borrower_id: borrowerId })]
    );

    const created = await this.findById(insertedId, conn);
    if (!created) throw new Error('Failed to retrieve newly created borrower');
    return created;
  }

  async update(id: number, data: BorrowerUpdateDto, updatedBy: number): Promise<MappedBorrower> {
    return withTransaction(async (conn) => {
      const existing = await this.findById(id, conn);
      if (!existing) throw new Error(`Borrower #${id} not found`);

      if (data.phone) {
        const phone = data.phone.trim();
        const duplicate = await this.findByPhone(phone, id, conn);
        if (duplicate) {
          throw new Error(`Phone number "${phone}" is already in use by another borrower (${duplicate.borrowerId})`);
        }
      }

      const updates: string[] = [];
      const values: unknown[] = [];

      const name = data.fullName !== undefined ? data.fullName : data.full_name;
      if (name !== undefined) {
        updates.push('full_name = ?');
        values.push(name.trim());
      }
      if (data.phone !== undefined) {
        updates.push('phone = ?');
        values.push(data.phone.trim());
      }
      if (data.email !== undefined) {
        updates.push('email = ?');
        values.push(data.email ? String(data.email).trim() : null);
      }
      if (data.address !== undefined) {
        updates.push('address = ?');
        values.push(data.address ? String(data.address).trim() : null);
      }
      if (data.notes !== undefined) {
        updates.push('notes = ?');
        values.push(data.notes ? String(data.notes).trim() : null);
      }
      if (data.status !== undefined) {
        updates.push('status = ?');
        values.push(data.status);
      }

      if (updates.length > 0) {
        values.push(id);
        await conn.execute<ResultSetHeader>(
          `UPDATE borrowers SET ${updates.join(', ')} WHERE id = ? AND deleted_at IS NULL`,
          values
        );
      }

      // Audit log
      await conn.execute(
        `INSERT INTO audit_logs (user_id, action, entity, entity_id, old_data, new_data)
         VALUES (?, 'UPDATE', 'borrower', ?, ?, ?)`,
        [updatedBy, String(id), JSON.stringify(existing), JSON.stringify(data)]
      );

      const updated = await this.findById(id, conn);
      if (!updated) throw new Error(`Borrower #${id} not found after update`);
      return updated;
    });
  }

  async softDelete(id: number, deletedBy: number): Promise<void> {
    return withTransaction(async (conn) => {
      const existing = await this.findById(id, conn);
      if (!existing) throw new Error(`Borrower #${id} not found`);

      // Guard: Check for active or overdue loans
      const [activeLoans] = await conn.query<RowDataPacket[]>(
        `SELECT COUNT(*) AS count FROM loans WHERE borrower_id = ? AND status IN ('active', 'overdue') AND deleted_at IS NULL`,
        [id]
      );

      if (activeLoans[0]?.count > 0) {
        throw new Error(
          `Cannot delete borrower "${existing.fullName}" (${existing.borrowerId}) because they have ${activeLoans[0].count} active or overdue loan(s).`
        );
      }

      await conn.execute<ResultSetHeader>(
        'UPDATE borrowers SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND deleted_at IS NULL',
        [id]
      );

      // Audit log
      await conn.execute(
        `INSERT INTO audit_logs (user_id, action, entity, entity_id, old_data)
         VALUES (?, 'DELETE', 'borrower', ?, ?)`,
        [deletedBy, String(id), JSON.stringify(existing)]
      );
    });
  }

  async getStats(borrowerId: number, connection?: PoolConnection): Promise<BorrowerStats> {
    const conn = connection || getPool();

    const sql = `
      SELECT
        COUNT(l.id) AS total_loans,
        IFNULL(SUM(CASE WHEN l.status IN ('active', 'overdue') THEN 1 ELSE 0 END), 0) AS active_loans,
        IFNULL(SUM(CASE WHEN l.status = 'completed' THEN 1 ELSE 0 END), 0) AS completed_loans,
        IFNULL(SUM(l.principal_amount), 0) AS total_principal_borrowed
      FROM loans l
      WHERE l.borrower_id = ? AND l.deleted_at IS NULL
    `;

    const [rows] = await conn.query<RowDataPacket[]>(sql, [borrowerId]);
    const row = rows[0] || {
      total_loans: 0,
      active_loans: 0,
      completed_loans: 0,
      total_principal_borrowed: 0,
    };

    // Calculate repaid principal and interest from payments linked to borrower's loans
    const paymentsSql = `
      SELECT
        IFNULL(SUM(p.principal_portion), 0) AS total_principal_repaid,
        IFNULL(SUM(p.interest_portion), 0) AS total_interest_paid
      FROM payments p
      JOIN loans l ON l.id = p.loan_id
      WHERE l.borrower_id = ? AND p.is_void = FALSE AND l.deleted_at IS NULL
    `;

    const [paymentRows] = await conn.query<RowDataPacket[]>(paymentsSql, [borrowerId]);
    const payRow = paymentRows[0] || { total_principal_repaid: 0, total_interest_paid: 0 };

    const borrowed = new Decimal(row.total_principal_borrowed || 0);
    const principalRepaid = new Decimal(payRow.total_principal_repaid || 0);
    const interestPaid = new Decimal(payRow.total_interest_paid || 0);
    const outstanding = Decimal.max(0, borrowed.minus(principalRepaid));

    return {
      totalLoans: Number(row.total_loans || 0),
      activeLoans: Number(row.active_loans || 0),
      completedLoans: Number(row.completed_loans || 0),
      totalPrincipalBorrowed: borrowed.toNumber(),
      totalPrincipalRepaid: principalRepaid.toNumber(),
      totalInterestPaid: interestPaid.toNumber(),
      totalOutstanding: outstanding.toNumber(),
    };
  }

  async getLoanHistory(borrowerId: number, connection?: PoolConnection): Promise<BorrowerLoanSummary[]> {
    const conn = connection || getPool();

    const sql = `
      SELECT
        l.id,
        l.loan_id,
        l.principal_amount,
        l.interest_rate,
        l.interest_rate_type,
        l.tenure,
        l.tenure_unit,
        CAST(l.loan_given_date AS CHAR) AS loan_given_date,
        CAST(l.due_date AS CHAR) AS due_date,
        l.total_expected_repayment,
        l.status,
        l.created_at,
        IFNULL(SUM(CASE WHEN p.is_void = FALSE THEN p.payment_amount ELSE 0 END), 0) AS total_paid
      FROM loans l
      LEFT JOIN payments p ON p.loan_id = l.id
      WHERE l.borrower_id = ? AND l.deleted_at IS NULL
      GROUP BY l.id
      ORDER BY l.loan_given_date DESC, l.id DESC
    `;

    const [rows] = await conn.query<RowDataPacket[]>(sql, [borrowerId]);

    return rows.map((r) => {
      const principal = new Decimal(r.principal_amount || 0);
      const expected = new Decimal(r.total_expected_repayment || principal);
      const paid = new Decimal(r.total_paid || 0);
      const outstanding = Decimal.max(0, expected.minus(paid));

      return {
        id: r.id,
        loanId: r.loan_id,
        principalAmount: principal.toNumber(),
        interestRate: Number(r.interest_rate || 0),
        interestRateType: r.interest_rate_type,
        tenure: Number(r.tenure || 0),
        tenureUnit: r.tenure_unit,
        loanGivenDate: String(r.loan_given_date || '').split('T')[0],
        dueDate: String(r.due_date || '').split('T')[0],
        totalExpectedRepayment: expected.toNumber(),
        status: r.status,
        totalPaid: paid.toNumber(),
        outstandingBalance: outstanding.toNumber(),
        createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
      };
    });
  }
}

export const borrowerRepository = new BorrowerRepository();
export default borrowerRepository;
