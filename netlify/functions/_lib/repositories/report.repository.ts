import { RowDataPacket, PoolConnection } from 'mysql2/promise';
import { getPool } from '../database';
import { loanRepository } from './loan.repository';
import {
  CapitalStatementItem,
  LoanReportItem,
  BorrowerReportItem,
  PaymentReportItem,
  OutstandingReportItem,
  OverdueReportItem,
  InterestReportItem,
  MonthlyCollectionItem,
  ReportFilterParams,
} from '../../../../src/types/report';

export class ReportRepository {
  /**
   * 1. Capital Statement Report
   */
  async getCapitalStatement(
    filters: ReportFilterParams = {},
    connection?: PoolConnection
  ): Promise<CapitalStatementItem[]> {
    const conn = connection || getPool();

    const conditions: string[] = ['deleted_at IS NULL'];
    const params: (string | number)[] = [];

    if (filters.startDate) {
      conditions.push('transaction_date >= ?');
      params.push(filters.startDate);
    }
    if (filters.endDate) {
      conditions.push('transaction_date <= ?');
      params.push(filters.endDate);
    }
    if (filters.search) {
      conditions.push('(transaction_id LIKE ? OR source LIKE ? OR destination LIKE ? OR description LIKE ? OR reference_number LIKE ?)');
      const searchPattern = `%${filters.search}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
    }

    const whereClause = conditions.join(' AND ');

    const [rows] = await conn.query<RowDataPacket[]>(
      `SELECT
        id,
        transaction_id,
        CAST(transaction_date AS CHAR) AS transaction_date,
        transaction_type,
        amount,
        source,
        destination,
        running_balance,
        description,
        reference_number
       FROM capital_transactions
       WHERE ${whereClause}
       ORDER BY transaction_date ASC, id ASC`,
      params
    );

    return rows.map((r) => ({
      id: r.id,
      transactionId: r.transaction_id,
      transactionDate: String(r.transaction_date).split('T')[0],
      transactionType: r.transaction_type,
      amount: Number(r.amount || 0),
      source: r.source,
      destination: r.destination,
      runningBalance: Number(r.running_balance || 0),
      description: r.description,
      referenceNumber: r.reference_number,
    }));
  }

  /**
   * 2. Loan Portfolio Report
   */
  async getLoanReport(
    filters: ReportFilterParams = {},
    connection?: PoolConnection
  ): Promise<LoanReportItem[]> {
    const conn = connection || getPool();

    const conditions: string[] = ['l.deleted_at IS NULL'];
    const params: (string | number)[] = [];

    if (filters.status && filters.status !== 'all') {
      conditions.push('l.status = ?');
      params.push(filters.status);
    }
    if (filters.borrowerId) {
      conditions.push('l.borrower_id = ?');
      params.push(filters.borrowerId);
    }
    if (filters.startDate) {
      conditions.push('l.loan_given_date >= ?');
      params.push(filters.startDate);
    }
    if (filters.endDate) {
      conditions.push('l.loan_given_date <= ?');
      params.push(filters.endDate);
    }
    if (filters.search) {
      conditions.push('(l.loan_id LIKE ? OR b.full_name LIKE ? OR b.phone LIKE ?)');
      const s = `%${filters.search}%`;
      params.push(s, s, s);
    }

    const whereClause = conditions.join(' AND ');

    const [rows] = await conn.query<RowDataPacket[]>(
      `SELECT
        l.id,
        l.loan_id,
        l.borrower_id,
        l.principal_amount,
        l.interest_rate,
        l.interest_rate_type,
        CAST(l.loan_given_date AS CHAR) AS loan_given_date,
        CAST(l.due_date AS CHAR) AS due_date,
        CAST(l.settlement_date AS CHAR) AS settlement_date,
        l.status,
        b.full_name AS borrower_name,
        b.phone AS borrower_phone
       FROM loans l
       JOIN borrowers b ON b.id = l.borrower_id
       WHERE ${whereClause}
       ORDER BY l.loan_given_date DESC, l.id DESC`,
      params
    );

    const result: LoanReportItem[] = [];

    for (const r of rows) {
      const calc = await loanRepository.calculateOutstanding(r.id, conn);
      result.push({
        id: r.id,
        loanId: r.loan_id,
        borrowerName: r.borrower_name,
        borrowerPhone: r.borrower_phone,
        principalAmount: Number(r.principal_amount || 0),
        interestRate: Number(r.interest_rate || 0),
        interestRateType: r.interest_rate_type,
        loanGivenDate: String(r.loan_given_date).split('T')[0],
        dueDate: r.due_date ? String(r.due_date).split('T')[0] : null,
        status: calc.isCompleted ? 'completed' : r.status,
        settlementDate: calc.settlementDate,
        tenure: calc.elapsedTenure,
        principalReceived: calc.principalReceived,
        interestReceived: calc.interestReceived,
        totalReceived: calc.totalReceived,
        principalOutstanding: calc.principalOutstanding,
        interestOutstanding: calc.interestOutstanding,
        totalOutstanding: calc.totalOutstanding,
      });
    }

    return result;
  }

  /**
   * 3. Borrower Directory & Credit Report
   */
  async getBorrowerReport(
    filters: ReportFilterParams = {},
    connection?: PoolConnection
  ): Promise<BorrowerReportItem[]> {
    const conn = connection || getPool();

    const conditions: string[] = ['b.deleted_at IS NULL'];
    const params: (string | number)[] = [];

    if (filters.search) {
      conditions.push('(b.borrower_id LIKE ? OR b.full_name LIKE ? OR b.phone LIKE ? OR b.email LIKE ?)');
      const s = `%${filters.search}%`;
      params.push(s, s, s, s);
    }

    const whereClause = conditions.join(' AND ');

    const [rows] = await conn.query<RowDataPacket[]>(
      `SELECT
        b.id,
        b.borrower_id,
        b.full_name,
        b.phone,
        b.email,
        b.address,
        IFNULL(l_agg.total_loans, 0) AS total_loans,
        IFNULL(l_agg.active_loans, 0) AS active_loans,
        IFNULL(l_agg.total_borrowed, 0) AS total_borrowed,
        IFNULL(p_agg.principal_repaid, 0) AS principal_repaid,
        IFNULL(p_agg.total_repaid, 0) AS total_repaid
       FROM borrowers b
       LEFT JOIN (
         SELECT
           borrower_id,
           COUNT(id) AS total_loans,
           SUM(CASE WHEN status IN ('active', 'overdue') THEN 1 ELSE 0 END) AS active_loans,
           SUM(principal_amount) AS total_borrowed
         FROM loans
         WHERE deleted_at IS NULL
         GROUP BY borrower_id
       ) l_agg ON l_agg.borrower_id = b.id
       LEFT JOIN (
         SELECT
           l.borrower_id,
           SUM(p.principal_portion) AS principal_repaid,
           SUM(p.payment_amount) AS total_repaid
         FROM payments p
         JOIN loans l ON l.id = p.loan_id
         WHERE p.is_void = FALSE AND l.deleted_at IS NULL
         GROUP BY l.borrower_id
       ) p_agg ON p_agg.borrower_id = b.id
       WHERE ${whereClause}
       ORDER BY b.full_name ASC`,
      params
    );

    // Query active/overdue loans for canonical interest & outstanding aggregation
    const borrowerIds = rows.map((r) => r.id);
    const borrowerTotalOutstandingMap = new Map<number, number>();

    if (borrowerIds.length > 0) {
      const [activeLoans] = await conn.query<RowDataPacket[]>(
        `SELECT id, borrower_id FROM loans
         WHERE borrower_id IN (?) AND status IN ('active', 'overdue') AND deleted_at IS NULL`,
        [borrowerIds]
      );

      for (const loan of activeLoans) {
        const calc = await loanRepository.calculateOutstanding(loan.id, conn);
        const currentSum = borrowerTotalOutstandingMap.get(loan.borrower_id) || 0;
        borrowerTotalOutstandingMap.set(loan.borrower_id, currentSum + calc.totalOutstanding);
      }
    }

    return rows.map((r) => {
      const totalBorrowed = Number(r.total_borrowed || 0);
      const principalRepaid = Number(r.principal_repaid || 0);
      const totalRepaid = Number(r.total_repaid || 0);
      const principalOutstanding = Math.max(0, totalBorrowed - principalRepaid);
      const totalOutstanding = borrowerTotalOutstandingMap.get(r.id) ?? 0;

      return {
        id: r.id,
        borrowerId: r.borrower_id,
        fullName: r.full_name,
        phone: r.phone,
        email: r.email,
        address: r.address,
        totalLoans: Number(r.total_loans || 0),
        activeLoans: Number(r.active_loans || 0),
        totalBorrowed,
        totalRepaid,
        principalOutstanding,
        totalOutstanding,
      };
    });
  }

  /**
   * 4. Payment Ledger & Allocation Report
   */
  async getPaymentReport(
    filters: ReportFilterParams = {},
    connection?: PoolConnection
  ): Promise<PaymentReportItem[]> {
    const conn = connection || getPool();

    const conditions: string[] = ['1=1'];
    const params: (string | number)[] = [];

    if (filters.startDate) {
      conditions.push('p.payment_date >= ?');
      params.push(filters.startDate);
    }
    if (filters.endDate) {
      conditions.push('p.payment_date <= ?');
      params.push(filters.endDate);
    }
    if (filters.paymentMode && filters.paymentMode !== 'all') {
      conditions.push('p.payment_mode = ?');
      params.push(filters.paymentMode);
    }
    if (filters.status === 'paid') {
      conditions.push('p.is_void = FALSE');
    } else if (filters.status === 'voided') {
      conditions.push('p.is_void = TRUE');
    }
    if (filters.loanId) {
      conditions.push('p.loan_id = ?');
      params.push(filters.loanId);
    }
    if (filters.borrowerId) {
      conditions.push('l.borrower_id = ?');
      params.push(filters.borrowerId);
    }
    if (filters.search) {
      conditions.push('(p.payment_id LIKE ? OR l.loan_id LIKE ? OR b.full_name LIKE ? OR p.reference_number LIKE ?)');
      const s = `%${filters.search}%`;
      params.push(s, s, s, s);
    }

    const whereClause = conditions.join(' AND ');

    const [rows] = await conn.query<RowDataPacket[]>(
      `SELECT
        p.id,
        p.payment_id,
        CAST(p.payment_date AS CHAR) AS payment_date,
        l.loan_id AS loan_custom_id,
        b.full_name AS borrower_name,
        p.payment_amount,
        p.principal_portion,
        p.interest_portion,
        p.payment_mode,
        p.reference_number,
        p.is_void,
        p.void_reason
       FROM payments p
       JOIN loans l ON l.id = p.loan_id
       JOIN borrowers b ON b.id = l.borrower_id
       WHERE ${whereClause}
       ORDER BY p.payment_date DESC, p.id DESC`,
      params
    );

    return rows.map((r) => ({
      id: r.id,
      paymentId: r.payment_id,
      paymentDate: String(r.payment_date).split('T')[0],
      loanId: r.loan_custom_id,
      borrowerName: r.borrower_name,
      paymentAmount: Number(r.payment_amount || 0),
      principalPortion: Number(r.principal_portion || 0),
      interestPortion: Number(r.interest_portion || 0),
      paymentMode: r.payment_mode,
      referenceNumber: r.reference_number,
      isVoid: Boolean(r.is_void),
      voidReason: r.void_reason,
    }));
  }

  /**
   * 5. Outstanding Portfolio Report
   */
  async getOutstandingReport(
    filters: ReportFilterParams = {},
    connection?: PoolConnection
  ): Promise<OutstandingReportItem[]> {
    const conn = connection || getPool();

    const conditions: string[] = ['l.status IN ("active", "overdue")', 'l.deleted_at IS NULL'];
    const params: (string | number)[] = [];

    if (filters.search) {
      conditions.push('(l.loan_id LIKE ? OR b.full_name LIKE ? OR b.phone LIKE ?)');
      const s = `%${filters.search}%`;
      params.push(s, s, s);
    }

    const whereClause = conditions.join(' AND ');

    const [rows] = await conn.query<RowDataPacket[]>(
      `SELECT
        l.id,
        l.loan_id,
        l.principal_amount,
        CAST(l.loan_given_date AS CHAR) AS loan_given_date,
        b.full_name AS borrower_name,
        b.phone AS borrower_phone
       FROM loans l
       JOIN borrowers b ON b.id = l.borrower_id
       WHERE ${whereClause}
       ORDER BY l.principal_amount DESC`,
      params
    );

    const result: OutstandingReportItem[] = [];

    for (const r of rows) {
      const calc = await loanRepository.calculateOutstanding(r.id, conn);
      if (calc.totalOutstanding > 0) {
        result.push({
          id: r.id,
          loanId: r.loan_id,
          borrowerName: r.borrower_name,
          borrowerPhone: r.borrower_phone,
          principalAmount: Number(r.principal_amount || 0),
          principalOutstanding: calc.principalOutstanding,
          interestOutstanding: calc.interestOutstanding,
          totalOutstanding: calc.totalOutstanding,
          loanGivenDate: String(r.loan_given_date).split('T')[0],
          daysActive: calc.elapsedDays,
        });
      }
    }

    // Sort by highest total outstanding
    return result.sort((a, b) => b.totalOutstanding - a.totalOutstanding);
  }

  /**
   * 6. Overdue Delinquency Report
   */
  async getOverdueReport(
    filters: ReportFilterParams = {},
    connection?: PoolConnection
  ): Promise<OverdueReportItem[]> {
    const conn = connection || getPool();

    const conditions: string[] = [
      'l.deleted_at IS NULL',
      '(l.status = "overdue" OR (l.due_date IS NOT NULL AND l.due_date < CURRENT_DATE() AND l.status = "active"))',
    ];
    const params: (string | number)[] = [];

    if (filters.search) {
      conditions.push('(l.loan_id LIKE ? OR b.full_name LIKE ? OR b.phone LIKE ?)');
      const s = `%${filters.search}%`;
      params.push(s, s, s);
    }

    const whereClause = conditions.join(' AND ');

    const [rows] = await conn.query<RowDataPacket[]>(
      `SELECT
        l.id,
        l.loan_id,
        l.principal_amount,
        CAST(l.due_date AS CHAR) AS due_date,
        b.full_name AS borrower_name,
        b.phone AS borrower_phone
       FROM loans l
       JOIN borrowers b ON b.id = l.borrower_id
       WHERE ${whereClause}
       ORDER BY l.due_date ASC`,
      params
    );

    const result: OverdueReportItem[] = [];

    for (const r of rows) {
      const calc = await loanRepository.calculateOutstanding(r.id, conn);
      if (calc.totalOutstanding > 0 && calc.isOverdue) {
        result.push({
          id: r.id,
          loanId: r.loan_id,
          borrowerName: r.borrower_name,
          borrowerPhone: r.borrower_phone,
          principalAmount: Number(r.principal_amount || 0),
          totalOutstanding: calc.totalOutstanding,
          dueDate: r.due_date ? String(r.due_date).split('T')[0] : '',
          daysOverdue: calc.daysOverdue,
        });
      }
    }

    return result.sort((a, b) => b.daysOverdue - a.daysOverdue);
  }

  /**
   * 7. Interest & Profit Realization Report
   */
  async getInterestReport(
    filters: ReportFilterParams = {},
    connection?: PoolConnection
  ): Promise<InterestReportItem[]> {
    const conn = connection || getPool();

    const conditions: string[] = ['is_void = FALSE'];
    const params: (string | number)[] = [];

    if (filters.startDate) {
      conditions.push('payment_date >= ?');
      params.push(filters.startDate);
    }
    if (filters.endDate) {
      conditions.push('payment_date <= ?');
      params.push(filters.endDate);
    }

    const whereClause = conditions.join(' AND ');

    // Group realized interest by month
    const [payRows] = await conn.query<RowDataPacket[]>(
      `SELECT
        DATE_FORMAT(payment_date, '%Y-%m') AS period,
        IFNULL(SUM(interest_portion), 0) AS realized_interest
       FROM payments
       WHERE ${whereClause}
       GROUP BY DATE_FORMAT(payment_date, '%Y-%m')
       ORDER BY period ASC`,
      params
    );

    // Group expected interest by loan creation month using calculateOutstanding
    const [loans] = await conn.query<RowDataPacket[]>(
      `SELECT id, CAST(loan_given_date AS CHAR) AS loan_given_date FROM loans WHERE deleted_at IS NULL`
    );

    const periodMap = new Map<string, { expected: number; realized: number }>();

    for (const l of loans) {
      const p = String(l.loan_given_date).substring(0, 7); // 'YYYY-MM'
      if (!periodMap.has(p)) periodMap.set(p, { expected: 0, realized: 0 });
      const calc = await loanRepository.calculateOutstanding(l.id, conn);
      periodMap.get(p)!.expected += calc.interestExpected;
    }

    for (const py of payRows) {
      const p = String(py.period);
      if (!periodMap.has(p)) periodMap.set(p, { expected: 0, realized: 0 });
      periodMap.get(p)!.realized += Number(py.realized_interest || 0);
    }

    const sortedPeriods = Array.from(periodMap.keys()).sort();
    return sortedPeriods.map((p) => {
      const val = periodMap.get(p)!;
      return {
        period: p,
        expectedInterest: Math.round(val.expected * 100) / 100,
        realizedInterest: Math.round(val.realized * 100) / 100,
        pendingInterest: Math.max(0, Math.round((val.expected - val.realized) * 100) / 100),
      };
    });
  }

  /**
   * 8. Monthly Collection Summary Report
   */
  async getMonthlyCollectionReport(
    year?: number,
    connection?: PoolConnection
  ): Promise<MonthlyCollectionItem[]> {
    const conn = connection || getPool();

    const targetYear = year || new Date().getFullYear();

    const [rows] = await conn.query<RowDataPacket[]>(
      `SELECT
        DATE_FORMAT(payment_date, '%Y-%m') AS month_str,
        MONTH(payment_date) AS month_num,
        YEAR(payment_date) AS year_num,
        IFNULL(SUM(principal_portion), 0) AS principal_collected,
        IFNULL(SUM(interest_portion), 0) AS interest_collected,
        IFNULL(SUM(payment_amount), 0) AS total_collected,
        COUNT(id) AS payment_count
       FROM payments
       WHERE is_void = FALSE AND YEAR(payment_date) = ?
       GROUP BY DATE_FORMAT(payment_date, '%Y-%m'), MONTH(payment_date), YEAR(payment_date)
       ORDER BY month_str ASC`,
      [targetYear]
    );

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];

    return rows.map((r) => ({
      month: monthNames[Number(r.month_num) - 1] || String(r.month_str),
      year: Number(r.year_num),
      principalCollected: Number(r.principal_collected || 0),
      interestCollected: Number(r.interest_collected || 0),
      totalCollected: Number(r.total_collected || 0),
      paymentCount: Number(r.payment_count || 0),
    }));
  }
}

export const reportRepository = new ReportRepository();
export default reportRepository;
