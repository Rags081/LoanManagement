import { RowDataPacket, ResultSetHeader, PoolConnection } from 'mysql2/promise';
import { getPool, withTransaction } from '../database';
import { generateId } from '../id-generator';
import {
  toLocalDateString,
  calculateCalendarTenure,
  calculatePeriodicAccrual,
  calculateMonthlyInterest,
  calculateDailyInterest,
  calculateLoanFinancials,
} from '../financial-engine';

export {
  toLocalDateString,
  calculateCalendarTenure,
  calculatePeriodicAccrual,
  calculateMonthlyInterest,
  calculateDailyInterest,
  calculateLoanFinancials,
};

export interface DbLoan extends RowDataPacket {
  id: number;
  loan_id: string;
  borrower_id: number;
  principal_amount: number | string;
  interest_rate: number | string;
  interest_rate_type: 'monthly' | 'daily' | 'flat';
  tenure: number | null;
  tenure_unit: 'days' | 'months' | 'years' | null;
  loan_given_date: string | Date;
  due_date: string | Date | null;
  total_expected_interest: number | string;
  total_expected_repayment: number | string;
  status: 'active' | 'overdue' | 'completed' | 'cancelled';
  settlement_date: string | Date | null;
  notes: string | null;
  created_by: number;
  created_at: Date | string;
  updated_at: Date | string;
  deleted_at: Date | string | null;
  // Joined borrower & creator fields
  borrower_name?: string;
  borrower_phone?: string;
  borrower_id_code?: string;
  creator_name?: string;
  // Aggregated payment fields
  total_received?: number | string;
  principal_received?: number | string;
  interest_received?: number | string;
  last_payment_date?: Date | string | null;
}

export interface InterestPaymentDetail {
  id: number;
  paymentId?: string;
  receiptNumber?: string;
  paymentDate: string;
  interestPortion: number;
  paymentAmount?: number;
  paymentMode?: string;
}

export interface MappedLoan {
  id: number;
  loanId: string;
  loan_id: string;
  borrowerId: number;
  borrower_id: number;
  borrowerName?: string;
  borrower_name?: string;
  borrowerPhone?: string;
  borrower_phone?: string;
  borrowerIdCode?: string;
  borrower_id_code?: string;
  principalAmount: number;
  principal_amount: number;
  interestRate: number;
  interest_rate: number;
  interestRateType: 'monthly' | 'daily' | 'flat';
  interest_rate_type: 'monthly' | 'daily' | 'flat';
  monthlyInterestAmount: number;
  monthly_interest_amount: number;
  dailyInterestAmount: number;
  daily_interest_amount: number;
  tenure: number | null;
  tenureUnit: 'days' | 'months' | 'years' | null;
  tenure_unit: 'days' | 'months' | 'years' | null;
  loanGivenDate: string;
  loan_given_date: string;
  dueDate: string | null;
  due_date: string | null;
  totalExpectedInterest: number;
  total_expected_interest: number;
  totalExpectedRepayment: number;
  total_expected_repayment: number;
  accruedInterest: number;
  accrued_interest: number;
  totalReceived: number;
  total_received: number;
  principalReceived: number;
  principal_received: number;
  interestReceived: number;
  interest_received: number;
  interestPaymentDetails?: InterestPaymentDetail[];
  interest_payment_details?: InterestPaymentDetail[];
  principalOutstanding: number;
  principal_outstanding: number;
  interestOutstanding: number;
  interest_outstanding: number;
  totalOutstanding: number;
  total_outstanding: number;
  status: 'active' | 'overdue' | 'completed' | 'cancelled';
  settlementDate: string | null;
  settlement_date: string | null;
  lastPaymentDate: string | null;
  last_payment_date: string | null;
  isSettled: boolean;
  is_settled: boolean;
  elapsedDays: number;
  elapsedTenure: string;
  actualTenure: string;
  notes: string | null;
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

export interface LoanCreateDto {
  loan_id?: string;
  loanId?: string;
  borrower_id?: number;
  borrowerId?: number;
  principal_amount?: number | string;
  principalAmount?: number | string;
  interest_rate?: number | string;
  interestRate?: number | string;
  interest_rate_type?: 'monthly' | 'daily' | 'flat';
  interestRateType?: 'monthly' | 'daily' | 'flat';
  tenure?: number | null;
  tenure_unit?: 'days' | 'months' | 'years' | null;
  tenureUnit?: 'days' | 'months' | 'years' | null;
  loan_given_date?: string;
  loanGivenDate?: string;
  due_date?: string | null;
  dueDate?: string | null;
  notes?: string | null;
  status?: 'active' | 'overdue' | 'completed' | 'cancelled';
}

export interface LoanUpdateDto {
  principal_amount?: number | string;
  principalAmount?: number | string;
  interest_rate?: number | string;
  interestRate?: number | string;
  interest_rate_type?: 'monthly' | 'daily' | 'flat';
  interestRateType?: 'monthly' | 'daily' | 'flat';
  tenure?: number | null;
  tenure_unit?: 'days' | 'months' | 'years' | null;
  tenureUnit?: 'days' | 'months' | 'years' | null;
  loan_given_date?: string;
  loanGivenDate?: string;
  due_date?: string | null;
  dueDate?: string | null;
  notes?: string | null;
  status?: 'active' | 'overdue' | 'completed' | 'cancelled';
  settlement_date?: string | null;
  settlementDate?: string | null;
}

export interface LoanFilterOptions {
  page?: number;
  limit?: number;
  borrowerId?: number;
  status?: string;
  startDate?: string;
  endDate?: string;
  minRate?: number;
  maxRate?: number;
  search?: string;
}

export interface LoanSummary {
  totalLoans: number;
  activeLoans: number;
  overdueLoans: number;
  completedLoans: number;
  cancelledLoans: number;
  totalPrincipalLent: number;
  totalExpectedInterest: number;
  totalExpectedRepayment: number;
  totalPrincipalRecovered: number;
  totalInterestRecovered: number;
  totalOutstanding: number;
}

export interface LoanOutstanding {
  principalAmount: number;
  principalReceived: number;
  principalOutstanding: number;
  interestExpected: number;
  accruedInterest: number;
  interestReceived: number;
  interestOutstanding: number;
  totalExpected: number;
  totalReceived: number;
  totalOutstanding: number;
  isOverdue: boolean;
  daysOverdue: number;
  elapsedDays: number;
  elapsedTenure: string;
  actualTenure: string;
  settlementDate?: string | null;
  isCompleted: boolean;
}

interface CountRow extends RowDataPacket {
  total: number;
}

export function mapDbToLoan(
  row: DbLoan,
  interestPaymentDetails: InterestPaymentDetail[] = []
): MappedLoan {
  const givenDate = toLocalDateString(row.loan_given_date);
  const dueDate = row.due_date ? toLocalDateString(row.due_date) : null;

  const principal = Number(row.principal_amount || 0);
  const rate = Number(row.interest_rate || 0);
  const rateType = row.interest_rate_type || 'monthly';

  const monthlyInterestAmount = calculateMonthlyInterest(principal, rate, rateType);
  const dailyInterestAmount = calculateDailyInterest(principal, rate, rateType);

  const totalReceived = Number(row.total_received || 0);
  const principalReceived = Number(row.principal_received || 0);
  const interestReceived = Number(row.interest_received || 0);

  const rawLastPay = row.last_payment_date;
  const lastPaymentDate = rawLastPay ? toLocalDateString(rawLastPay) : null;

  const todayStr = toLocalDateString(new Date());
  const isSettledStatus = row.status === 'completed';

  const rawSettlement = row.settlement_date;
  const settlementDate = rawSettlement
    ? toLocalDateString(rawSettlement)
    : isSettledStatus
    ? (lastPaymentDate || todayStr)
    : null;

  const endDateStr = isSettledStatus && settlementDate ? settlementDate : todayStr;

  // Accrued interest to date/settlement date
  const accruedInterest = calculatePeriodicAccrual(principal, rate, rateType, givenDate, endDateStr);

  const principalOutstanding = Math.max(0, principal - principalReceived);
  const interestOutstanding = Math.max(0, accruedInterest - interestReceived);
  const totalOutstanding = principalOutstanding + interestOutstanding;
  const isSettled = isSettledStatus || (totalOutstanding === 0 && totalReceived > 0);

  const tenureResult = calculateCalendarTenure(givenDate, endDateStr);
  const elapsedDays = tenureResult.totalDays;
  const elapsedTenure = tenureResult.formatted;

  return {
    id: row.id,
    loanId: row.loan_id,
    loan_id: row.loan_id,
    borrowerId: row.borrower_id,
    borrower_id: row.borrower_id,
    borrowerName: row.borrower_name,
    borrower_name: row.borrower_name,
    borrowerPhone: row.borrower_phone,
    borrower_phone: row.borrower_phone,
    borrowerIdCode: row.borrower_id_code,
    borrower_id_code: row.borrower_id_code,
    principalAmount: principal,
    principal_amount: principal,
    interestRate: rate,
    interest_rate: rate,
    interestRateType: rateType,
    interest_rate_type: rateType,
    monthlyInterestAmount,
    monthly_interest_amount: monthlyInterestAmount,
    dailyInterestAmount,
    daily_interest_amount: dailyInterestAmount,
    tenure: row.tenure ? Number(row.tenure) : null,
    tenureUnit: row.tenure_unit || null,
    tenure_unit: row.tenure_unit || null,
    loanGivenDate: givenDate,
    loan_given_date: givenDate,
    dueDate: dueDate,
    due_date: dueDate,
    totalExpectedInterest: Number(row.total_expected_interest || accruedInterest),
    total_expected_interest: Number(row.total_expected_interest || accruedInterest),
    totalExpectedRepayment: Number(row.total_expected_repayment || (principal + accruedInterest)),
    total_expected_repayment: Number(row.total_expected_repayment || (principal + accruedInterest)),
    accruedInterest,
    accrued_interest: accruedInterest,
    totalReceived,
    total_received: totalReceived,
    principalReceived,
    principal_received: principalReceived,
    interestReceived,
    interest_received: interestReceived,
    interestPaymentDetails,
    interest_payment_details: interestPaymentDetails,
    principalOutstanding,
    principal_outstanding: principalOutstanding,
    interestOutstanding,
    interest_outstanding: interestOutstanding,
    totalOutstanding,
    total_outstanding: totalOutstanding,
    status: row.status,
    settlementDate,
    settlement_date: settlementDate,
    lastPaymentDate,
    last_payment_date: lastPaymentDate,
    isSettled,
    is_settled: isSettled,
    elapsedDays,
    elapsedTenure,
    actualTenure: elapsedTenure,
    notes: row.notes,
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

export class LoanRepository {
  async findById(id: number, connection?: PoolConnection): Promise<MappedLoan | null> {
    const conn = connection || getPool();
    const sql = `
      SELECT
        l.*,
        b.full_name AS borrower_name,
        b.phone AS borrower_phone,
        b.borrower_id AS borrower_id_code,
        u.full_name AS creator_name,
        IFNULL(SUM(p.payment_amount), 0) AS total_received,
        IFNULL(SUM(p.principal_portion), 0) AS principal_received,
        IFNULL(SUM(p.interest_portion), 0) AS interest_received,
        MAX(p.payment_date) AS last_payment_date
      FROM loans l
      LEFT JOIN borrowers b ON b.id = l.borrower_id
      LEFT JOIN users u ON u.id = l.created_by
      LEFT JOIN payments p ON p.loan_id = l.id AND p.is_void = FALSE
      WHERE l.id = ? AND l.deleted_at IS NULL
      GROUP BY l.id
      LIMIT 1
    `;
    const [rows] = await conn.query<DbLoan[]>(sql, [id]);
    if (!rows[0]) return null;

    const [payRows] = await conn.query<RowDataPacket[]>(
      `SELECT
        id,
        loan_id,
        payment_id,
        payment_amount,
        principal_portion,
        interest_portion,
        payment_mode,
        CAST(payment_date AS CHAR) AS payment_date,
        created_at
       FROM payments
       WHERE loan_id = ? AND is_void = FALSE AND interest_portion > 0
       ORDER BY payment_date ASC, id ASC`,
      [id]
    );

    const details: InterestPaymentDetail[] = payRows.map((p) => ({
      id: p.id,
      paymentId: p.payment_id,
      receiptNumber: p.payment_id,
      paymentDate: String(p.payment_date || '').split('T')[0],
      interestPortion: Number(p.interest_portion || 0),
      paymentAmount: Number(p.payment_amount || 0),
      paymentMode: p.payment_mode,
    }));

    return mapDbToLoan(rows[0], details);
  }

  async findByLoanId(loanId: string, connection?: PoolConnection): Promise<MappedLoan | null> {
    const conn = connection || getPool();
    const sql = `
      SELECT
        l.*,
        b.full_name AS borrower_name,
        b.phone AS borrower_phone,
        b.borrower_id AS borrower_id_code,
        u.full_name AS creator_name,
        IFNULL(SUM(p.payment_amount), 0) AS total_received,
        IFNULL(SUM(p.principal_portion), 0) AS principal_received,
        IFNULL(SUM(p.interest_portion), 0) AS interest_received,
        MAX(p.payment_date) AS last_payment_date
      FROM loans l
      LEFT JOIN borrowers b ON b.id = l.borrower_id
      LEFT JOIN users u ON u.id = l.created_by
      LEFT JOIN payments p ON p.loan_id = l.id AND p.is_void = FALSE
      WHERE l.loan_id = ? AND l.deleted_at IS NULL
      GROUP BY l.id
      LIMIT 1
    `;
    const [rows] = await conn.query<DbLoan[]>(sql, [loanId.trim()]);
    if (!rows[0]) return null;

    const [payRows] = await conn.query<RowDataPacket[]>(
      `SELECT
        id,
        loan_id,
        payment_id,
        payment_amount,
        principal_portion,
        interest_portion,
        payment_mode,
        CAST(payment_date AS CHAR) AS payment_date,
        created_at
       FROM payments
       WHERE loan_id = ? AND is_void = FALSE AND interest_portion > 0
       ORDER BY payment_date ASC, id ASC`,
      [rows[0].id]
    );

    const details: InterestPaymentDetail[] = payRows.map((p) => ({
      id: p.id,
      paymentId: p.payment_id,
      receiptNumber: p.payment_id,
      paymentDate: String(p.payment_date || '').split('T')[0],
      interestPortion: Number(p.interest_portion || 0),
      paymentAmount: Number(p.payment_amount || 0),
      paymentMode: p.payment_mode,
    }));

    return mapDbToLoan(rows[0], details);
  }

  async findByBorrower(borrowerId: number, connection?: PoolConnection): Promise<MappedLoan[]> {
    const conn = connection || getPool();
    const sql = `
      SELECT
        l.*,
        b.full_name AS borrower_name,
        b.phone AS borrower_phone,
        b.borrower_id AS borrower_id_code,
        u.full_name AS creator_name,
        IFNULL(SUM(p.payment_amount), 0) AS total_received,
        IFNULL(SUM(p.principal_portion), 0) AS principal_received,
        IFNULL(SUM(p.interest_portion), 0) AS interest_received,
        MAX(p.payment_date) AS last_payment_date
      FROM loans l
      LEFT JOIN borrowers b ON b.id = l.borrower_id
      LEFT JOIN users u ON u.id = l.created_by
      LEFT JOIN payments p ON p.loan_id = l.id AND p.is_void = FALSE
      WHERE l.borrower_id = ? AND l.deleted_at IS NULL
      GROUP BY l.id
      ORDER BY l.loan_given_date DESC, l.id DESC
    `;
    const [rows] = await conn.query<DbLoan[]>(sql, [borrowerId]);

    const loanIds = rows.map((r) => r.id);
    const paymentsMap = new Map<number, InterestPaymentDetail[]>();

    if (loanIds.length > 0) {
      const [payRows] = await conn.query<RowDataPacket[]>(
        `SELECT
          id,
          loan_id,
          payment_id,
          payment_amount,
          principal_portion,
          interest_portion,
          payment_mode,
          CAST(payment_date AS CHAR) AS payment_date,
          created_at
         FROM payments
         WHERE loan_id IN (?) AND is_void = FALSE AND interest_portion > 0
         ORDER BY payment_date ASC, id ASC`,
        [loanIds]
      );

      for (const p of payRows) {
        const lid = Number(p.loan_id);
        if (!paymentsMap.has(lid)) paymentsMap.set(lid, []);
        paymentsMap.get(lid)!.push({
          id: p.id,
          paymentId: p.payment_id,
          receiptNumber: p.payment_id,
          paymentDate: String(p.payment_date || '').split('T')[0],
          interestPortion: Number(p.interest_portion || 0),
          paymentAmount: Number(p.payment_amount || 0),
          paymentMode: p.payment_mode,
        });
      }
    }

    return rows.map((r) => mapDbToLoan(r, paymentsMap.get(r.id) || []));
  }

  async findAll(
    filters: LoanFilterOptions = {},
    connection?: PoolConnection
  ): Promise<{ data: MappedLoan[]; total: number; page: number; limit: number; totalPages: number }> {
    const conn = connection || getPool();
    const conditions: string[] = ['l.deleted_at IS NULL'];
    const params: unknown[] = [];

    if (filters.borrowerId) {
      conditions.push('l.borrower_id = ?');
      params.push(filters.borrowerId);
    }

    if (filters.status && filters.status !== 'all') {
      conditions.push('l.status = ?');
      params.push(filters.status);
    }

    if (filters.startDate) {
      conditions.push('l.loan_given_date >= ?');
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      conditions.push('l.loan_given_date <= ?');
      params.push(filters.endDate);
    }

    if (filters.minRate !== undefined && !isNaN(filters.minRate)) {
      conditions.push('l.interest_rate >= ?');
      params.push(filters.minRate);
    }

    if (filters.maxRate !== undefined && !isNaN(filters.maxRate)) {
      conditions.push('l.interest_rate <= ?');
      params.push(filters.maxRate);
    }

    if (filters.search) {
      const pattern = `%${filters.search.trim()}%`;
      conditions.push('(l.loan_id LIKE ? OR b.full_name LIKE ? OR b.phone LIKE ? OR b.borrower_id LIKE ?)');
      params.push(pattern, pattern, pattern, pattern);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const [countRows] = await conn.query<CountRow[]>(
      `SELECT COUNT(*) AS total
       FROM loans l
       LEFT JOIN borrowers b ON b.id = l.borrower_id
       ${whereClause}`,
      params
    );
    const total = countRows[0]?.total || 0;

    const page = Math.max(1, filters.page || 1);
    const limit = Math.max(1, filters.limit || 10);
    const offset = (page - 1) * limit;
    const totalPages = Math.ceil(total / limit) || 1;

    const sql = `
      SELECT
        l.*,
        b.full_name AS borrower_name,
        b.phone AS borrower_phone,
        b.borrower_id AS borrower_id_code,
        u.full_name AS creator_name,
        IFNULL(SUM(p.payment_amount), 0) AS total_received,
        IFNULL(SUM(p.principal_portion), 0) AS principal_received,
        IFNULL(SUM(p.interest_portion), 0) AS interest_received,
        MAX(p.payment_date) AS last_payment_date
      FROM loans l
      LEFT JOIN borrowers b ON b.id = l.borrower_id
      LEFT JOIN users u ON u.id = l.created_by
      LEFT JOIN payments p ON p.loan_id = l.id AND p.is_void = FALSE
      ${whereClause}
      GROUP BY l.id
      ORDER BY l.loan_given_date DESC, l.id DESC
      LIMIT ? OFFSET ?
    `;

    const [rows] = await conn.query<DbLoan[]>(sql, [...params, limit, offset]);

    const loanIds = rows.map((r) => r.id);
    const paymentsMap = new Map<number, InterestPaymentDetail[]>();

    if (loanIds.length > 0) {
      const [payRows] = await conn.query<RowDataPacket[]>(
        `SELECT
          id,
          loan_id,
          payment_id,
          payment_amount,
          principal_portion,
          interest_portion,
          payment_mode,
          CAST(payment_date AS CHAR) AS payment_date,
          created_at
         FROM payments
         WHERE loan_id IN (?) AND is_void = FALSE AND interest_portion > 0
         ORDER BY payment_date ASC, id ASC`,
        [loanIds]
      );

      for (const p of payRows) {
        const lid = Number(p.loan_id);
        if (!paymentsMap.has(lid)) paymentsMap.set(lid, []);
        paymentsMap.get(lid)!.push({
          id: p.id,
          paymentId: p.payment_id,
          receiptNumber: p.payment_id,
          paymentDate: String(p.payment_date || '').split('T')[0],
          interestPortion: Number(p.interest_portion || 0),
          paymentAmount: Number(p.payment_amount || 0),
          paymentMode: p.payment_mode,
        });
      }
    }

    const data = rows.map((r) => mapDbToLoan(r, paymentsMap.get(r.id) || []));
    return { data, total, page, limit, totalPages };
  }

  async create(
    data: LoanCreateDto,
    createdBy: number,
    connection?: PoolConnection
  ): Promise<MappedLoan> {
    if (!connection) {
      return withTransaction((conn) => this.create(data, createdBy, conn));
    }

    const conn = connection;
    const borrowerId = Number(data.borrowerId || data.borrower_id);
    if (!borrowerId || isNaN(borrowerId)) {
      throw new Error('Valid borrowerId is required');
    }

    // Verify borrower exists
    const [borrowers] = await conn.query<RowDataPacket[]>(
      'SELECT id, status FROM borrowers WHERE id = ? AND deleted_at IS NULL',
      [borrowerId]
    );
    if (!borrowers || borrowers.length === 0) {
      throw new Error(`Borrower #${borrowerId} does not exist`);
    }
    if (borrowers[0].status === 'blacklisted') {
      throw new Error('Cannot issue new loans to a blacklisted borrower');
    }

    const loanId =
      data.loanId ||
      data.loan_id ||
      (await generateId('LN', 'loans', 'loan_id', conn));

    const principal = Number(data.principalAmount || data.principal_amount);
    if (!principal || principal <= 0) {
      throw new Error('Principal amount must be greater than 0');
    }

    const interestRate = Number(data.interestRate !== undefined ? data.interestRate : data.interest_rate);
    if (isNaN(interestRate) || interestRate < 0) {
      throw new Error('Interest rate must be 0 or higher');
    }

    const rateType = data.interestRateType || data.interest_rate_type || 'monthly';
    const givenDate = (data.loanGivenDate || data.loan_given_date || new Date().toISOString().split('T')[0]).split('T')[0];

    // Open-ended loan: tenure and dueDate are optional
    const tenure = data.tenure ? Number(data.tenure) : null;
    const tenureUnit = data.tenureUnit || data.tenure_unit || null;
    const dueDate = data.dueDate || data.due_date ? String(data.dueDate || data.due_date).split('T')[0] : null;

    const monthlyInterest = calculateMonthlyInterest(principal, interestRate, rateType);
    const totalExpectedInterest = monthlyInterest; // Base initial monthly expected interest
    const totalExpectedRepayment = principal + totalExpectedInterest;

    const notes = data.notes ? String(data.notes).trim() : null;
    const status = data.status || 'active';

    const [res] = await conn.execute<ResultSetHeader>(
      `INSERT INTO loans (
        loan_id, borrower_id, principal_amount, interest_rate, interest_rate_type,
        tenure, tenure_unit, loan_given_date, due_date, total_expected_interest,
        total_expected_repayment, status, settlement_date, notes, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)`,
      [
        loanId,
        borrowerId,
        principal,
        interestRate,
        rateType,
        tenure,
        tenureUnit,
        givenDate,
        dueDate,
        totalExpectedInterest,
        totalExpectedRepayment,
        status,
        notes,
        createdBy,
      ]
    );

    const insertedId = res.insertId;

    // Audit log
    await conn.execute(
      `INSERT INTO audit_logs (user_id, action, entity, entity_id, new_data)
       VALUES (?, 'CREATE', 'loan', ?, ?)`,
      [createdBy, String(insertedId), JSON.stringify({ ...data, loan_id: loanId })]
    );

    const created = await this.findById(insertedId, conn);
    if (!created) throw new Error('Failed to retrieve newly created loan');
    return created;
  }

  async update(id: number, data: LoanUpdateDto, updatedBy: number): Promise<MappedLoan> {
    return withTransaction(async (conn) => {
      const existing = await this.findById(id, conn);
      if (!existing) throw new Error(`Loan #${id} not found`);

      const principal = data.principalAmount !== undefined
        ? Number(data.principalAmount)
        : data.principal_amount !== undefined
        ? Number(data.principal_amount)
        : existing.principalAmount;

      const rate = data.interestRate !== undefined
        ? Number(data.interestRate)
        : data.interest_rate !== undefined
        ? Number(data.interest_rate)
        : existing.interestRate;

      const rateType = data.interestRateType || data.interest_rate_type || existing.interestRateType;
      const tenure = data.tenure !== undefined ? (data.tenure ? Number(data.tenure) : null) : existing.tenure;
      const tenureUnit = data.tenureUnit !== undefined ? (data.tenureUnit || null) : existing.tenureUnit;
      const givenDate = (data.loanGivenDate || data.loan_given_date || existing.loanGivenDate).split('T')[0];
      const dueDate = data.dueDate !== undefined ? (data.dueDate ? String(data.dueDate).split('T')[0] : null) : existing.dueDate;

      const monthlyInterest = calculateMonthlyInterest(principal, rate, rateType);
      const totalExpectedInterest = monthlyInterest;
      const totalExpectedRepayment = principal + totalExpectedInterest;

      const notes = data.notes !== undefined
        ? (data.notes ? String(data.notes).trim() : null)
        : existing.notes;

      const status = data.status || existing.status;
      const settlementDate = data.settlementDate !== undefined
        ? (data.settlementDate ? String(data.settlementDate).split('T')[0] : null)
        : data.settlement_date !== undefined
        ? (data.settlement_date ? String(data.settlement_date).split('T')[0] : null)
        : existing.settlementDate;

      await conn.execute<ResultSetHeader>(
        `UPDATE loans SET
          principal_amount = ?,
          interest_rate = ?,
          interest_rate_type = ?,
          tenure = ?,
          tenure_unit = ?,
          loan_given_date = ?,
          due_date = ?,
          total_expected_interest = ?,
          total_expected_repayment = ?,
          status = ?,
          settlement_date = ?,
          notes = ?
        WHERE id = ? AND deleted_at IS NULL`,
        [
          principal,
          rate,
          rateType,
          tenure,
          tenureUnit,
          givenDate,
          dueDate,
          totalExpectedInterest,
          totalExpectedRepayment,
          status,
          settlementDate,
          notes,
          id,
        ]
      );

      // Audit log
      await conn.execute(
        `INSERT INTO audit_logs (user_id, action, entity, entity_id, old_data, new_data)
         VALUES (?, 'UPDATE', 'loan', ?, ?, ?)`,
        [updatedBy, String(id), JSON.stringify(existing), JSON.stringify(data)]
      );

      const updated = await this.findById(id, conn);
      if (!updated) throw new Error(`Loan #${id} not found after update`);
      return updated;
    });
  }

  async delete(id: number, deletedBy: number): Promise<void> {
    return this.softDelete(id, deletedBy);
  }

  async softDelete(id: number, deletedBy: number): Promise<void> {
    return withTransaction(async (conn) => {
      const existing = await this.findById(id, conn);
      if (!existing) throw new Error(`Loan #${id} not found`);

      // Guard: Cannot delete loan if valid payments exist
      const [payments] = await conn.query<RowDataPacket[]>(
        'SELECT COUNT(*) AS count FROM payments WHERE loan_id = ? AND is_void = FALSE',
        [id]
      );

      if (payments[0]?.count > 0) {
        throw new Error(`Cannot delete loan "${existing.loanId}" because it has ${payments[0].count} recorded payment(s).`);
      }

      await conn.execute<ResultSetHeader>(
        'UPDATE loans SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND deleted_at IS NULL',
        [id]
      );

      // Audit log
      await conn.execute(
        `INSERT INTO audit_logs (user_id, action, entity, entity_id, old_data)
         VALUES (?, 'DELETE', 'loan', ?, ?)`,
        [deletedBy, String(id), JSON.stringify(existing)]
      );
    });
  }

  async updateStatus(id: number, status: 'active' | 'overdue' | 'completed' | 'cancelled', updatedBy: number): Promise<MappedLoan> {
    return withTransaction(async (conn) => {
      const existing = await this.findById(id, conn);
      if (!existing) throw new Error(`Loan #${id} not found`);

      const settlementDate = status === 'completed'
        ? (existing.lastPaymentDate || new Date().toISOString().split('T')[0])
        : null;

      await conn.execute<ResultSetHeader>(
        'UPDATE loans SET status = ?, settlement_date = ? WHERE id = ? AND deleted_at IS NULL',
        [status, settlementDate, id]
      );

      await conn.execute(
        `INSERT INTO audit_logs (user_id, action, entity, entity_id, old_data, new_data)
         VALUES (?, 'UPDATE_STATUS', 'loan', ?, ?, ?)`,
        [updatedBy, String(id), JSON.stringify({ status: existing.status }), JSON.stringify({ status, settlement_date: settlementDate })]
      );

      const updated = await this.findById(id, conn);
      if (!updated) throw new Error(`Loan #${id} not found`);
      return updated;
    });
  }

  /**
   * Deterministic ledger reconciliation of reducing principal balance and accrued interest
   */
  async calculateOutstanding(loanId: number, connection?: PoolConnection, asOfDate: Date | string = new Date()): Promise<LoanOutstanding> {
    const conn = connection || getPool();
    const loan = await this.findById(loanId, conn);
    if (!loan) {
      throw new Error(`Loan #${loanId} not found`);
    }

    const [payments] = await conn.query<RowDataPacket[]>(
      `SELECT
        id,
        payment_amount,
        principal_portion,
        interest_portion,
        CAST(payment_date AS CHAR) AS payment_date
       FROM payments
       WHERE loan_id = ? AND is_void = FALSE
       ORDER BY payment_date ASC, id ASC`,
      [loanId]
    );

    const result = calculateLoanFinancials(loan, payments, asOfDate);

    // Automatic status synchronization in database if completed
    if (result.isCompleted && loan.status !== 'completed') {
      await conn.execute(
        'UPDATE loans SET status = "completed", settlement_date = ? WHERE id = ? AND deleted_at IS NULL',
        [result.settlementDate, loanId]
      );
    }

    return result;
  }

  async getLoanSummary(filters: LoanFilterOptions = {}, connection?: PoolConnection): Promise<LoanSummary> {
    const conn = connection || getPool();
    const conditions: string[] = ['l.deleted_at IS NULL'];
    const params: unknown[] = [];

    if (filters.borrowerId) {
      conditions.push('l.borrower_id = ?');
      params.push(filters.borrowerId);
    }

    if (filters.status && filters.status !== 'all') {
      conditions.push('l.status = ?');
      params.push(filters.status);
    }

    if (filters.startDate) {
      conditions.push('l.loan_given_date >= ?');
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      conditions.push('l.loan_given_date <= ?');
      params.push(filters.endDate);
    }

    if (filters.minRate !== undefined && !isNaN(filters.minRate)) {
      conditions.push('l.interest_rate >= ?');
      params.push(filters.minRate);
    }

    if (filters.maxRate !== undefined && !isNaN(filters.maxRate)) {
      conditions.push('l.interest_rate <= ?');
      params.push(filters.maxRate);
    }

    if (filters.search) {
      const pattern = `%${filters.search.trim()}%`;
      conditions.push('(l.loan_id LIKE ? OR b.full_name LIKE ? OR b.phone LIKE ? OR b.borrower_id LIKE ?)');
      params.push(pattern, pattern, pattern, pattern);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const sql = `
      SELECT
        COUNT(l.id) AS total_loans,
        IFNULL(SUM(CASE WHEN l.status = 'active' THEN 1 ELSE 0 END), 0) AS active_loans,
        IFNULL(SUM(CASE WHEN l.status = 'overdue' THEN 1 ELSE 0 END), 0) AS overdue_loans,
        IFNULL(SUM(CASE WHEN l.status = 'completed' THEN 1 ELSE 0 END), 0) AS completed_loans,
        IFNULL(SUM(CASE WHEN l.status = 'cancelled' THEN 1 ELSE 0 END), 0) AS cancelled_loans,
        IFNULL(SUM(l.principal_amount), 0) AS total_principal_lent
      FROM loans l
      LEFT JOIN borrowers b ON b.id = l.borrower_id
      ${whereClause}
    `;

    const [rows] = await conn.query<RowDataPacket[]>(sql, params);
    const row = rows[0] || {};

    const [matchingLoans] = await conn.query<RowDataPacket[]>(
      `SELECT l.id FROM loans l LEFT JOIN borrowers b ON b.id = l.borrower_id ${whereClause}`,
      params
    );
    let expectedInt = 0;
    for (const ml of matchingLoans) {
      const calc = await this.calculateOutstanding(ml.id, conn);
      expectedInt += calc.interestExpected;
    }
    expectedInt = Math.round(expectedInt * 100) / 100;

    const [payments] = await conn.query<RowDataPacket[]>(
      `SELECT
        IFNULL(SUM(p.principal_portion), 0) AS principal_recovered,
        IFNULL(SUM(p.interest_portion), 0) AS interest_recovered,
        IFNULL(SUM(p.payment_amount), 0) AS total_recovered
       FROM payments p
       JOIN loans l ON l.id = p.loan_id
       LEFT JOIN borrowers b ON b.id = l.borrower_id
       ${whereClause} AND p.is_void = FALSE`,
      params
    );

    const payRow = payments[0] || { principal_recovered: 0, interest_recovered: 0, total_recovered: 0 };
    const lent = Number(row.total_principal_lent || 0);
    const princRec = Number(payRow.principal_recovered || 0);
    const intRec = Number(payRow.interest_recovered || 0);
    const netOutstanding = Math.max(0, lent - princRec);

    return {
      totalLoans: Number(row.total_loans || 0),
      activeLoans: Number(row.active_loans || 0),
      overdueLoans: Number(row.overdue_loans || 0),
      completedLoans: Number(row.completed_loans || 0),
      cancelledLoans: Number(row.cancelled_loans || 0),
      totalPrincipalLent: lent,
      totalExpectedInterest: expectedInt,
      totalExpectedRepayment: lent + expectedInt,
      totalPrincipalRecovered: princRec,
      totalInterestRecovered: intRec,
      totalOutstanding: netOutstanding,
    };
  }

  async getLoanPayments(loanId: number, connection?: PoolConnection): Promise<RowDataPacket[]> {
    const conn = connection || getPool();
    const sql = `
      SELECT
        p.id,
        p.payment_id,
        p.payment_id AS receipt_number,
        p.reference_number,
        CAST(p.payment_date AS CHAR) AS payment_date,
        p.payment_amount,
        p.principal_portion,
        p.interest_portion,
        p.payment_mode,
        p.is_void,
        p.notes,
        p.created_at
      FROM payments p
      WHERE p.loan_id = ?
      ORDER BY p.payment_date DESC, p.id DESC
    `;
    const [rows] = await conn.query<RowDataPacket[]>(sql, [loanId]);
    return rows;
  }

  async getOverdueLoans(asOfDate?: Date | string, connection?: PoolConnection): Promise<MappedLoan[]> {
    const conn = connection || getPool();
    const today = toLocalDateString(asOfDate || new Date());
    const sql = `
      SELECT
        l.*,
        b.full_name AS borrower_name,
        b.phone AS borrower_phone,
        b.borrower_id AS borrower_id_code,
        u.full_name AS creator_name
      FROM loans l
      LEFT JOIN borrowers b ON b.id = l.borrower_id
      LEFT JOIN users u ON u.id = l.created_by
      WHERE l.deleted_at IS NULL
        AND l.due_date IS NOT NULL
        AND l.due_date < ?
        AND l.status IN ('active', 'overdue')
      ORDER BY l.due_date ASC
    `;
    const [rows] = await conn.query<DbLoan[]>(sql, [today]);
    const mapped = await Promise.all(rows.map((row) => this.mapLoanRow(row, conn)));
    return mapped.filter((l) => l.totalOutstanding > 0);
  }
}

export const loanRepository = new LoanRepository();
export default loanRepository;
