import { RowDataPacket, ResultSetHeader, PoolConnection } from 'mysql2/promise';
import { getPool, withTransaction } from '../database';
import { generateId } from '../id-generator';
import { loanRepository } from './loan.repository';
import Decimal from 'decimal.js';

export interface DbPayment extends RowDataPacket {
  id: number;
  payment_id: string;
  loan_id: number;
  payment_date: string | Date;
  payment_amount: number | string;
  principal_portion: number | string;
  interest_portion: number | string;
  payment_mode: 'cash' | 'upi' | 'bank_transfer' | 'other';
  reference_number: string | null;
  notes: string | null;
  is_void: number | boolean;
  void_reason: string | null;
  voided_at: Date | string | null;
  voided_by: number | null;
  created_by: number;
  created_at: Date | string;
  updated_at: Date | string;
  // Joined fields
  loan_custom_id?: string;
  borrower_name?: string;
  borrower_phone?: string;
  borrower_id_code?: string;
  borrower_id?: number;
  voided_by_name?: string;
  creator_name?: string;
}

export interface DbPaymentAllocation extends RowDataPacket {
  id: number;
  payment_id: number;
  allocated_to: 'principal' | 'interest' | 'late_fee' | 'penalty';
  amount: number | string;
  running_principal_balance: number | string;
  running_interest_balance: number | string;
  created_at: Date | string;
}

export interface PaymentCreateDto {
  payment_id?: string;
  loan_id: number;
  payment_date: string;
  payment_amount: number | string;
  principal_portion?: number | string;
  interest_portion?: number | string;
  payment_mode: 'cash' | 'upi' | 'bank_transfer' | 'other';
  reference_number?: string | null;
  notes?: string | null;
  allocation_method?: 'interest_first' | 'principal_first' | 'proportional';
}

export interface PaymentFilters {
  loan_id?: number;
  borrower_id?: number;
  payment_mode?: string;
  is_void?: boolean;
  from_date?: string;
  to_date?: string;
  search?: string;
}

export interface PaymentSummaryDto {
  totalPayments: number;
  totalCollected: number;
  principalCollected: number;
  interestCollected: number;
  collectedThisMonth: number;
  voidedPaymentsCount: number;
  voidedAmount: number;
}

interface CountRow extends RowDataPacket {
  total: number;
}

export class PaymentRepository {
  async findById(id: number, connection?: PoolConnection): Promise<DbPayment | null> {
    const conn = connection || getPool();
    const sql = `
      SELECT
        p.*,
        l.loan_id AS loan_custom_id,
        l.borrower_id,
        b.full_name AS borrower_name,
        b.phone AS borrower_phone,
        b.borrower_id AS borrower_id_code,
        u_creator.full_name AS creator_name,
        u_voider.full_name AS voided_by_name
      FROM payments p
      JOIN loans l ON l.id = p.loan_id
      JOIN borrowers b ON b.id = l.borrower_id
      LEFT JOIN users u_creator ON u_creator.id = p.created_by
      LEFT JOIN users u_voider ON u_voider.id = p.voided_by
      WHERE p.id = ?
      LIMIT 1
    `;
    const [rows] = await conn.query<DbPayment[]>(sql, [id]);
    return rows[0] || null;
  }

  async findByPaymentId(paymentId: string, connection?: PoolConnection): Promise<DbPayment | null> {
    const conn = connection || getPool();
    const sql = `
      SELECT
        p.*,
        l.loan_id AS loan_custom_id,
        l.borrower_id,
        b.full_name AS borrower_name,
        b.phone AS borrower_phone,
        b.borrower_id AS borrower_id_code,
        u_creator.full_name AS creator_name,
        u_voider.full_name AS voided_by_name
      FROM payments p
      JOIN loans l ON l.id = p.loan_id
      JOIN borrowers b ON b.id = l.borrower_id
      LEFT JOIN users u_creator ON u_creator.id = p.created_by
      LEFT JOIN users u_voider ON u_voider.id = p.voided_by
      WHERE p.payment_id = ?
      LIMIT 1
    `;
    const [rows] = await conn.query<DbPayment[]>(sql, [paymentId.trim()]);
    return rows[0] || null;
  }

  async findAll(
    filters: PaymentFilters = {},
    pagination: { page?: number; limit?: number } = {},
    connection?: PoolConnection
  ): Promise<{ data: DbPayment[]; total: number; page: number; limit: number; totalPages: number }> {
    const conn = connection || getPool();
    const conditions: string[] = ['1=1'];
    const params: unknown[] = [];

    if (filters.loan_id) {
      conditions.push('p.loan_id = ?');
      params.push(filters.loan_id);
    }
    if (filters.borrower_id) {
      conditions.push('l.borrower_id = ?');
      params.push(filters.borrower_id);
    }
    if (filters.payment_mode && filters.payment_mode !== 'all') {
      conditions.push('p.payment_mode = ?');
      params.push(filters.payment_mode);
    }
    if (filters.is_void !== undefined) {
      conditions.push('p.is_void = ?');
      params.push(filters.is_void ? 1 : 0);
    }
    if (filters.from_date) {
      conditions.push('p.payment_date >= ?');
      params.push(filters.from_date);
    }
    if (filters.to_date) {
      conditions.push('p.payment_date <= ?');
      params.push(filters.to_date);
    }
    if (filters.search) {
      const pattern = `%${filters.search.trim()}%`;
      conditions.push('(p.payment_id LIKE ? OR l.loan_id LIKE ? OR b.full_name LIKE ? OR b.phone LIKE ? OR p.reference_number LIKE ?)');
      params.push(pattern, pattern, pattern, pattern, pattern);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    // Total Count
    const [countRows] = await conn.query<CountRow[]>(
      `SELECT COUNT(*) AS total
       FROM payments p
       JOIN loans l ON l.id = p.loan_id
       JOIN borrowers b ON b.id = l.borrower_id
       ${whereClause}`,
      params
    );
    const total = countRows[0]?.total || 0;

    const page = Math.max(1, pagination.page || 1);
    const limit = Math.max(1, pagination.limit || 10);
    const offset = (page - 1) * limit;
    const totalPages = Math.ceil(total / limit) || 1;

    const sql = `
      SELECT
        p.*,
        l.loan_id AS loan_custom_id,
        l.borrower_id,
        b.full_name AS borrower_name,
        b.phone AS borrower_phone,
        b.borrower_id AS borrower_id_code,
        u_creator.full_name AS creator_name,
        u_voider.full_name AS voided_by_name
      FROM payments p
      JOIN loans l ON l.id = p.loan_id
      JOIN borrowers b ON b.id = l.borrower_id
      LEFT JOIN users u_creator ON u_creator.id = p.created_by
      LEFT JOIN users u_voider ON u_voider.id = p.voided_by
      ${whereClause}
      ORDER BY p.payment_date DESC, p.id DESC
      LIMIT ? OFFSET ?
    `;

    const [data] = await conn.query<DbPayment[]>(sql, [...params, limit, offset]);
    return { data, total, page, limit, totalPages };
  }

  async findByLoan(loanId: number, connection?: PoolConnection): Promise<DbPayment[]> {
    const conn = connection || getPool();
    const [rows] = await conn.query<DbPayment[]>(
      `SELECT
        p.*,
        l.loan_id AS loan_custom_id,
        l.borrower_id,
        b.full_name AS borrower_name,
        u_creator.full_name AS creator_name
       FROM payments p
       JOIN loans l ON l.id = p.loan_id
       JOIN borrowers b ON b.id = l.borrower_id
       LEFT JOIN users u_creator ON u_creator.id = p.created_by
       WHERE p.loan_id = ?
       ORDER BY p.payment_date DESC, p.id DESC`,
      [loanId]
    );
    return rows;
  }

  async getTotalReceivedByLoan(loanId: number, connection?: PoolConnection): Promise<{ total: number; principalTotal: number; interestTotal: number }> {
    const conn = connection || getPool();
    const [rows] = await conn.query<RowDataPacket[]>(
      `SELECT
        IFNULL(SUM(payment_amount), 0) AS total,
        IFNULL(SUM(principal_portion), 0) AS principal_total,
        IFNULL(SUM(interest_portion), 0) AS interest_total
       FROM payments
       WHERE loan_id = ? AND is_void = FALSE`,
      [loanId]
    );
    const row = rows[0] || {};
    return {
      total: Number(row.total || 0),
      principalTotal: Number(row.principal_total || 0),
      interestTotal: Number(row.interest_total || 0),
    };
  }

  async getAllocations(paymentId: number, connection?: PoolConnection): Promise<DbPaymentAllocation[]> {
    const conn = connection || getPool();
    const [rows] = await conn.query<DbPaymentAllocation[]>(
      'SELECT * FROM payment_allocations WHERE payment_id = ? ORDER BY id ASC',
      [paymentId]
    );
    return rows;
  }

  /**
   * Records new payment with atomic allocation & loan settlement check
   */
  async create(
    data: PaymentCreateDto,
    createdBy: number,
    connection?: PoolConnection
  ): Promise<DbPayment> {
    if (!connection) {
      return withTransaction((conn) => this.create(data, createdBy, conn));
    }

    const conn = connection;
    Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

    const loanId = Number(data.loan_id);
    if (!loanId || isNaN(loanId)) {
      throw new Error('Valid loan_id is required');
    }

    // 1. Calculate live outstanding breakdown on the loan
    const outstanding = await loanRepository.calculateOutstanding(loanId, conn);

    const paymentAmount = new Decimal(data.payment_amount);
    if (paymentAmount.lessThanOrEqualTo(0)) {
      throw new Error('Payment amount must be greater than 0');
    }

    const totalOutstanding = new Decimal(outstanding.totalOutstanding);
    if (paymentAmount.greaterThan(totalOutstanding)) {
      throw new Error(`Payment amount (₹${paymentAmount}) exceeds total outstanding balance (₹${totalOutstanding}).`);
    }

    const remPrincipalBefore = new Decimal(outstanding.principalOutstanding);
    const remInterestBefore = new Decimal(outstanding.interestOutstanding);

    let principalPortion = new Decimal(0);
    let interestPortion = new Decimal(0);

    // 2. Perform allocation calculation
    if (data.principal_portion !== undefined && data.interest_portion !== undefined) {
      principalPortion = new Decimal(data.principal_portion);
      interestPortion = new Decimal(data.interest_portion);
    } else {
      const method = data.allocation_method || 'interest_first';

      if (method === 'interest_first') {
        interestPortion = Decimal.min(paymentAmount, remInterestBefore);
        const remainder = paymentAmount.minus(interestPortion);
        principalPortion = Decimal.min(remainder, remPrincipalBefore);
      } else if (method === 'principal_first') {
        principalPortion = Decimal.min(paymentAmount, remPrincipalBefore);
        const remainder = paymentAmount.minus(principalPortion);
        interestPortion = Decimal.min(remainder, remInterestBefore);
      } else {
        // Proportional allocation based on principal:interest outstanding ratio
        const sumOutstanding = remPrincipalBefore.plus(remInterestBefore);
        if (sumOutstanding.isZero()) {
          principalPortion = paymentAmount;
        } else {
          const pRatio = remPrincipalBefore.dividedBy(sumOutstanding);
          principalPortion = Decimal.min(paymentAmount.times(pRatio), remPrincipalBefore).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
          interestPortion = paymentAmount.minus(principalPortion);
        }
      }
    }

    const runningPrincipal = Decimal.max(0, remPrincipalBefore.minus(principalPortion)).toNumber();
    const runningInterest = Decimal.max(0, remInterestBefore.minus(interestPortion)).toNumber();

    const payDate = (data.payment_date || new Date().toISOString().split('T')[0]).split('T')[0];

    // 3. Generate ID & Insert Payment
    const paymentId = data.payment_id || (await generateId('PAY', 'payments', 'payment_id', conn));

    const [res] = await conn.execute<ResultSetHeader>(
      `INSERT INTO payments (
        payment_id, loan_id, payment_date, payment_amount, principal_portion,
        interest_portion, payment_mode, reference_number, notes, is_void, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, FALSE, ?)`,
      [
        paymentId,
        loanId,
        payDate,
        paymentAmount.toNumber(),
        principalPortion.toNumber(),
        interestPortion.toNumber(),
        data.payment_mode,
        data.reference_number || null,
        data.notes ? String(data.notes).trim() : null,
        createdBy,
      ]
    );

    const insertedDbId = res.insertId;

    // 4. Create Payment Allocation Records for Audit Trail
    if (interestPortion.greaterThan(0)) {
      await conn.execute(
        `INSERT INTO payment_allocations (
          payment_id, allocated_to, amount, running_principal_balance, running_interest_balance
        ) VALUES (?, 'interest', ?, ?, ?)`,
        [insertedDbId, interestPortion.toNumber(), remPrincipalBefore.toNumber(), runningInterest]
      );
    }

    if (principalPortion.greaterThan(0)) {
      await conn.execute(
        `INSERT INTO payment_allocations (
          payment_id, allocated_to, amount, running_principal_balance, running_interest_balance
        ) VALUES (?, 'principal', ?, ?, ?)`,
        [insertedDbId, principalPortion.toNumber(), runningPrincipal, runningInterest]
      );
    }

    // 5. Automatic Loan Settlement Check
    if (runningPrincipal === 0 && runningInterest === 0) {
      await conn.execute(
        `UPDATE loans SET status = 'completed', settlement_date = ? WHERE id = ? AND deleted_at IS NULL`,
        [payDate, loanId]
      );
    }

    // 6. Audit Log
    await conn.execute(
      `INSERT INTO audit_logs (user_id, action, entity, entity_id, new_data)
       VALUES (?, 'CREATE', 'payment', ?, ?)`,
      [
        createdBy,
        String(insertedDbId),
        JSON.stringify({
          paymentId,
          loanId,
          paymentAmount: paymentAmount.toNumber(),
          principalPortion: principalPortion.toNumber(),
          interestPortion: interestPortion.toNumber(),
          paymentDate: payDate,
        }),
      ]
    );

    const created = await this.findById(insertedDbId, conn);
    if (!created) throw new Error('Failed to retrieve newly created payment');
    return created;
  }

  /**
   * Voids payment, reverses allocation, and restores loan status if needed
   */
  async void(id: number, voidReason: string, voidedBy: number): Promise<DbPayment> {
    return withTransaction(async (conn) => {
      const existing = await this.findById(id, conn);
      if (!existing) throw new Error(`Payment #${id} not found`);

      if (existing.is_void) {
        throw new Error(`Payment "${existing.payment_id}" is already voided`);
      }

      const cleanReason = String(voidReason || '').trim();
      if (!cleanReason) {
        throw new Error('A void reason is required');
      }

      // Mark payment as void
      await conn.execute<ResultSetHeader>(
        `UPDATE payments SET
          is_void = TRUE,
          void_reason = ?,
          voided_at = CURRENT_TIMESTAMP,
          voided_by = ?
        WHERE id = ?`,
        [cleanReason, voidedBy, id]
      );

      // Re-evaluate loan outstanding & settlement status
      const updatedOutstanding = await loanRepository.calculateOutstanding(existing.loan_id, conn);

      if (updatedOutstanding.totalOutstanding > 0) {
        // If loan was completed but now has balance, revert to active
        await conn.execute(
          `UPDATE loans SET status = 'active', settlement_date = NULL WHERE id = ? AND deleted_at IS NULL`,
          [existing.loan_id]
        );
      }

      // Audit Log
      await conn.execute(
        `INSERT INTO audit_logs (user_id, action, entity, entity_id, old_data, new_data)
         VALUES (?, 'VOID', 'payment', ?, ?, ?)`,
        [
          voidedBy,
          String(id),
          JSON.stringify({ is_void: false, payment_amount: existing.payment_amount }),
          JSON.stringify({ is_void: true, void_reason: cleanReason, voided_by: voidedBy }),
        ]
      );

      const voided = await this.findById(id, conn);
      if (!voided) throw new Error(`Payment #${id} not found after voiding`);
      return voided;
    });
  }

  /**
   * Summary metrics for payments
   */
  async getPaymentSummary(filters: PaymentFilters = {}, connection?: PoolConnection): Promise<PaymentSummaryDto> {
    const conn = connection || getPool();
    const conditions: string[] = ['1=1'];
    const params: unknown[] = [];

    if (filters.loan_id) {
      conditions.push('p.loan_id = ?');
      params.push(filters.loan_id);
    }
    if (filters.borrower_id) {
      conditions.push('l.borrower_id = ?');
      params.push(filters.borrower_id);
    }
    if (filters.payment_mode && filters.payment_mode !== 'all') {
      conditions.push('p.payment_mode = ?');
      params.push(filters.payment_mode);
    }
    if (filters.from_date) {
      conditions.push('p.payment_date >= ?');
      params.push(filters.from_date);
    }
    if (filters.to_date) {
      conditions.push('p.payment_date <= ?');
      params.push(filters.to_date);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const [rows] = await conn.query<RowDataPacket[]>(
      `SELECT
        COUNT(CASE WHEN p.is_void = FALSE THEN 1 END) AS total_payments,
        IFNULL(SUM(CASE WHEN p.is_void = FALSE THEN p.payment_amount ELSE 0 END), 0) AS total_collected,
        IFNULL(SUM(CASE WHEN p.is_void = FALSE THEN p.principal_portion ELSE 0 END), 0) AS principal_collected,
        IFNULL(SUM(CASE WHEN p.is_void = FALSE THEN p.interest_portion ELSE 0 END), 0) AS interest_collected,
        IFNULL(SUM(CASE WHEN p.is_void = FALSE AND MONTH(p.payment_date) = MONTH(CURRENT_DATE()) AND YEAR(p.payment_date) = YEAR(CURRENT_DATE()) THEN p.payment_amount ELSE 0 END), 0) AS collected_this_month,
        COUNT(CASE WHEN p.is_void = TRUE THEN 1 END) AS voided_count,
        IFNULL(SUM(CASE WHEN p.is_void = TRUE THEN p.payment_amount ELSE 0 END), 0) AS voided_amount
       FROM payments p
       JOIN loans l ON l.id = p.loan_id
       ${whereClause}`,
      params
    );

    const r = rows[0] || {};
    return {
      totalPayments: Number(r.total_payments || 0),
      totalCollected: Number(r.total_collected || 0),
      principalCollected: Number(r.principal_collected || 0),
      interestCollected: Number(r.interest_collected || 0),
      collectedThisMonth: Number(r.collected_this_month || 0),
      voidedPaymentsCount: Number(r.voided_count || 0),
      voidedAmount: Number(r.voided_amount || 0),
    };
  }
}

export const paymentRepository = new PaymentRepository();
export default paymentRepository;
