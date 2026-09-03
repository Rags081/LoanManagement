import { RowDataPacket, PoolConnection } from 'mysql2/promise';
import { getPool } from '../database';
import { loanRepository } from './loan.repository';
import { calculateLoanFinancials } from '../financial-engine';
import {
  CapitalMetrics,
  LoanMetrics,
  CollectionMetrics,
  ProfitMetrics,
  LoanTrendPoint,
  CollectionTrendPoint,
  OutstandingTrendPoint,
  ActivityLogItem,
  OverdueAlertItem,
  DashboardMetrics,
} from '../../../../src/types/dashboard';

export class DashboardRepository {
  async getCapitalMetrics(connection?: PoolConnection): Promise<CapitalMetrics> {
    const conn = connection || getPool();

    // 1. Capital transactions sum (ignoring deleted rows)
    const [capRows] = await conn.query<RowDataPacket[]>(
      `SELECT
        IFNULL(SUM(CASE WHEN transaction_type = 'capital_given' THEN amount ELSE 0 END), 0) AS total_given,
        IFNULL(SUM(CASE WHEN transaction_type = 'capital_returned' THEN amount ELSE 0 END), 0) AS total_returned,
        IFNULL(SUM(CASE WHEN transaction_type = 'adjustment' THEN amount ELSE 0 END), 0) AS total_adjustments
       FROM capital_transactions
       WHERE deleted_at IS NULL`
    );
    const cap = capRows[0] || {};
    const given = Number(cap.total_given || 0);
    const returned = Number(cap.total_returned || 0);
    const adjustments = Number(cap.total_adjustments || 0);
    const netInvestedCapital = given - returned + adjustments;

    // 2. Total principal lent out across all loans
    const [loanRows] = await conn.query<RowDataPacket[]>(
      `SELECT IFNULL(SUM(principal_amount), 0) AS total_lent
       FROM loans
       WHERE deleted_at IS NULL`
    );
    const totalLent = Number(loanRows[0]?.total_lent || 0);

    // 3. Total principal and interest collected back
    const [payRows] = await conn.query<RowDataPacket[]>(
      `SELECT
        IFNULL(SUM(p.principal_portion), 0) AS total_princ_rec,
        IFNULL(SUM(p.interest_portion), 0) AS total_int_rec
       FROM payments p
       JOIN loans l ON l.id = p.loan_id
       WHERE p.is_void = FALSE AND l.deleted_at IS NULL`
    );
    const totalPrincRec = Number(payRows[0]?.total_princ_rec || 0);
    const totalIntRec = Number(payRows[0]?.total_int_rec || 0);
    const totalCollections = totalPrincRec + totalIntRec;

    // Physical available cash to disburse:
    // Available Cash = (Invested Capital - Capital Returned + Adjustments) - Total Lent + Total Collections
    const availableToDisburse = Math.max(0, netInvestedCapital - totalLent + totalCollections);

    return {
      totalGiven: given,
      totalReturned: returned,
      currentBalance: netInvestedCapital,
      unallocated: availableToDisburse,
    };
  }

  async getLoanMetrics(connection?: PoolConnection): Promise<LoanMetrics> {
    const conn = connection || getPool();

    const [rows] = await conn.query<RowDataPacket[]>(
      `SELECT
        COUNT(id) AS total_loans,
        IFNULL(SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END), 0) AS active_loans,
        IFNULL(SUM(CASE WHEN status = 'overdue' THEN 1 ELSE 0 END), 0) AS overdue_loans,
        IFNULL(SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END), 0) AS completed_loans,
        IFNULL(SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END), 0) AS cancelled_loans,
        IFNULL(SUM(principal_amount), 0) AS total_lent
       FROM loans
       WHERE deleted_at IS NULL`
    );
    const r = rows[0] || {};

    // Count loans that are active/overdue and have at least 1 valid principal payment
    const [partRows] = await conn.query<RowDataPacket[]>(
      `SELECT COUNT(DISTINCT l.id) AS partially_paid
       FROM loans l
       JOIN payments p ON p.loan_id = l.id
       WHERE l.status IN ('active', 'overdue') AND l.deleted_at IS NULL
         AND p.is_void = FALSE AND p.principal_portion > 0`
    );
    const partiallyPaid = Number(partRows[0]?.partially_paid || 0);

    return {
      totalLoans: Number(r.total_loans || 0),
      activeLoans: Number(r.active_loans || 0),
      overdueLoans: Number(r.overdue_loans || 0),
      completedLoans: Number(r.completed_loans || 0),
      cancelledLoans: Number(r.cancelled_loans || 0),
      partiallyPaidLoans: partiallyPaid,
      totalLent: Number(r.total_lent || 0),
    };
  }

  async getCollectionMetrics(connection?: PoolConnection): Promise<CollectionMetrics> {
    const conn = connection || getPool();

    const [payRows] = await conn.query<RowDataPacket[]>(
      `SELECT
        IFNULL(SUM(p.principal_portion), 0) AS princ_rec,
        IFNULL(SUM(p.interest_portion), 0) AS int_rec,
        IFNULL(SUM(p.payment_amount), 0) AS total_rec
       FROM payments p
       JOIN loans l ON l.id = p.loan_id
       WHERE p.is_void = FALSE AND l.deleted_at IS NULL`
    );
    const pay = payRows[0] || {};
    const princRec = Number(pay.princ_rec || 0);
    const intRec = Number(pay.int_rec || 0);
    const totalRec = Number(pay.total_rec || 0);

    // Fetch active/overdue loans and payments in batch
    const [activeLoans] = await conn.query<RowDataPacket[]>(
      `SELECT * FROM loans WHERE status IN ('active', 'overdue') AND deleted_at IS NULL`
    );

    const [payments] = await conn.query<RowDataPacket[]>(
      `SELECT p.* FROM payments p
       JOIN loans l ON l.id = p.loan_id
       WHERE l.status IN ('active', 'overdue') AND l.deleted_at IS NULL AND p.is_void = FALSE
       ORDER BY p.payment_date ASC, p.id ASC`
    );

    const paymentsMap = new Map<number, RowDataPacket[]>();
    for (const p of payments) {
      const lId = Number(p.loan_id);
      if (!paymentsMap.has(lId)) paymentsMap.set(lId, []);
      paymentsMap.get(lId)!.push(p);
    }

    let outstandingPrinc = 0;
    let outstandingInt = 0;
    let totalOutstanding = 0;

    for (const row of activeLoans) {
      const lPayments = paymentsMap.get(Number(row.id)) || [];
      const calc = calculateLoanFinancials(
        {
          id: Number(row.id),
          loanId: String(row.loan_id),
          principalAmount: Number(row.principal_amount || 0),
          interestRate: Number(row.interest_rate || 0),
          interestRateType: row.interest_rate_type || 'monthly',
          loanGivenDate: row.loan_given_date,
          dueDate: row.due_date,
          status: row.status,
          settlementDate: row.settlement_date,
          total_expected_interest: Number(row.total_expected_interest || 0),
        },
        lPayments,
        new Date()
      );
      outstandingPrinc += calc.principalOutstanding;
      outstandingInt += calc.interestOutstanding;
      totalOutstanding += calc.totalOutstanding;
    }

    return {
      totalPrincipalReceived: princRec,
      totalInterestReceived: intRec,
      totalAmountReceived: totalRec,
      outstandingPrincipal: outstandingPrinc,
      outstandingInterest: outstandingInt,
      totalOutstanding,
    };
  }

  async getProfitMetrics(connection?: PoolConnection): Promise<ProfitMetrics> {
    const conn = connection || getPool();

    // 1. Get all non-deleted loans and all payments in batch
    const [loanRows] = await conn.query<RowDataPacket[]>(
      `SELECT * FROM loans WHERE deleted_at IS NULL`
    );

    const [payments] = await conn.query<RowDataPacket[]>(
      `SELECT p.* FROM payments p
       JOIN loans l ON l.id = p.loan_id
       WHERE l.deleted_at IS NULL AND p.is_void = FALSE
       ORDER BY p.payment_date ASC, p.id ASC`
    );

    const paymentsMap = new Map<number, RowDataPacket[]>();
    let realized = 0;
    for (const p of payments) {
      const lId = Number(p.loan_id);
      realized += Number(p.interest_portion || 0);
      if (!paymentsMap.has(lId)) paymentsMap.set(lId, []);
      paymentsMap.get(lId)!.push(p);
    }

    let totalExpectedInterest = 0;
    for (const row of loanRows) {
      const lPayments = paymentsMap.get(Number(row.id)) || [];
      const calc = calculateLoanFinancials(
        {
          id: Number(row.id),
          loanId: String(row.loan_id),
          principalAmount: Number(row.principal_amount || 0),
          interestRate: Number(row.interest_rate || 0),
          interestRateType: row.interest_rate_type || 'monthly',
          loanGivenDate: row.loan_given_date,
          dueDate: row.due_date,
          status: row.status,
          settlementDate: row.settlement_date,
          total_expected_interest: Number(row.total_expected_interest || 0),
        },
        lPayments,
        new Date()
      );
      totalExpectedInterest += calc.interestExpected;
    }

    const pending = Math.max(0, totalExpectedInterest - realized);

    return {
      expectedInterest: Math.round(totalExpectedInterest * 100) / 100,
      realizedInterest: Math.round(realized * 100) / 100,
      pendingInterest: Math.round(pending * 100) / 100,
    };
  }

  async getLoansOverTime(
    period: 'daily' | 'weekly' | 'monthly' = 'monthly',
    connection?: PoolConnection
  ): Promise<LoanTrendPoint[]> {
    const conn = connection || getPool();

    let sql = '';
    if (period === 'daily') {
      sql = `
        SELECT
          DATE_FORMAT(loan_given_date, '%Y-%m-%d') AS period,
          COUNT(id) AS count,
          IFNULL(SUM(principal_amount), 0) AS amount
        FROM loans
        WHERE deleted_at IS NULL AND loan_given_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
        GROUP BY DATE_FORMAT(loan_given_date, '%Y-%m-%d')
        ORDER BY period ASC
      `;
    } else if (period === 'weekly') {
      sql = `
        SELECT
          DATE_FORMAT(loan_given_date, '%x-W%v') AS period,
          COUNT(id) AS count,
          IFNULL(SUM(principal_amount), 0) AS amount
        FROM loans
        WHERE deleted_at IS NULL AND loan_given_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 12 WEEK)
        GROUP BY DATE_FORMAT(loan_given_date, '%x-W%v')
        ORDER BY period ASC
      `;
    } else {
      // Monthly
      sql = `
        SELECT
          DATE_FORMAT(loan_given_date, '%Y-%m') AS period,
          COUNT(id) AS count,
          IFNULL(SUM(principal_amount), 0) AS amount
        FROM loans
        WHERE deleted_at IS NULL AND loan_given_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 12 MONTH)
        GROUP BY DATE_FORMAT(loan_given_date, '%Y-%m')
        ORDER BY period ASC
      `;
    }

    const [rows] = await conn.query<RowDataPacket[]>(sql);
    return rows.map((r) => ({
      period: String(r.period),
      count: Number(r.count || 0),
      amount: Number(r.amount || 0),
    }));
  }

  async getCollectionsOverTime(
    period: 'daily' | 'weekly' | 'monthly' = 'monthly',
    connection?: PoolConnection
  ): Promise<CollectionTrendPoint[]> {
    const conn = connection || getPool();

    let sql = '';
    if (period === 'daily') {
      sql = `
        SELECT
          DATE_FORMAT(payment_date, '%Y-%m-%d') AS period,
          IFNULL(SUM(principal_portion), 0) AS principal,
          IFNULL(SUM(interest_portion), 0) AS interest,
          IFNULL(SUM(payment_amount), 0) AS total
        FROM payments
        WHERE is_void = FALSE AND payment_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
        GROUP BY DATE_FORMAT(payment_date, '%Y-%m-%d')
        ORDER BY period ASC
      `;
    } else if (period === 'weekly') {
      sql = `
        SELECT
          DATE_FORMAT(payment_date, '%x-W%v') AS period,
          IFNULL(SUM(principal_portion), 0) AS principal,
          IFNULL(SUM(interest_portion), 0) AS interest,
          IFNULL(SUM(payment_amount), 0) AS total
        FROM payments
        WHERE is_void = FALSE AND payment_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 12 WEEK)
        GROUP BY DATE_FORMAT(payment_date, '%x-W%v')
        ORDER BY period ASC
      `;
    } else {
      // Monthly
      sql = `
        SELECT
          DATE_FORMAT(payment_date, '%Y-%m') AS period,
          IFNULL(SUM(principal_portion), 0) AS principal,
          IFNULL(SUM(interest_portion), 0) AS interest,
          IFNULL(SUM(payment_amount), 0) AS total
        FROM payments
        WHERE is_void = FALSE AND payment_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 12 MONTH)
        GROUP BY DATE_FORMAT(payment_date, '%Y-%m')
        ORDER BY period ASC
      `;
    }

    const [rows] = await conn.query<RowDataPacket[]>(sql);
    return rows.map((r) => ({
      period: String(r.period),
      principal: Number(r.principal || 0),
      interest: Number(r.interest || 0),
      total: Number(r.total || 0),
    }));
  }

  async getOutstandingTrend(
    period: 'daily' | 'weekly' | 'monthly' = 'monthly',
    connection?: PoolConnection
  ): Promise<OutstandingTrendPoint[]> {
    const conn = connection || getPool();

    const loansTrend = await this.getLoansOverTime(period, conn);
    const collectionsTrend = await this.getCollectionsOverTime(period, conn);

    // Merge periods into sorted set
    const periodMap = new Map<string, { lent: number; collected: number }>();

    for (const l of loansTrend) {
      if (!periodMap.has(l.period)) periodMap.set(l.period, { lent: 0, collected: 0 });
      periodMap.get(l.period)!.lent += l.amount;
    }

    for (const c of collectionsTrend) {
      if (!periodMap.has(c.period)) periodMap.set(c.period, { lent: 0, collected: 0 });
      periodMap.get(c.period)!.collected += c.principal;
    }

    const sortedPeriods = Array.from(periodMap.keys()).sort();
    let cumulativeOutstanding = 0;
    const result: OutstandingTrendPoint[] = [];

    for (const p of sortedPeriods) {
      const data = periodMap.get(p)!;
      cumulativeOutstanding = Math.max(0, cumulativeOutstanding + data.lent - data.collected);
      result.push({
        period: p,
        outstanding: cumulativeOutstanding,
      });
    }

    return result;
  }

  async getRecentActivity(limit: number = 10, connection?: PoolConnection): Promise<ActivityLogItem[]> {
    const conn = connection || getPool();

    const [rows] = await conn.query<RowDataPacket[]>(
      `SELECT
        a.id,
        a.created_at AS timestamp,
        a.action,
        a.entity,
        a.entity_id,
        IFNULL(u.full_name, 'System') AS user_name,
        a.new_data
       FROM audit_logs a
       LEFT JOIN users u ON u.id = a.user_id
       ORDER BY a.id DESC
       LIMIT ?`,
      [Math.max(1, limit)]
    );

    return rows.map((r) => {
      let details: string | null = null;
      if (r.new_data) {
        try {
          const parsed = typeof r.new_data === 'string' ? JSON.parse(r.new_data) : r.new_data;
          if (r.entity === 'payment') {
            details = `Repayment of ₹${parsed.paymentAmount || parsed.payment_amount || 0} recorded for loan #${parsed.loanId || parsed.loan_id || ''}`;
          } else if (r.entity === 'loan') {
            details = `Loan ${parsed.loanId || ''} disbursed for ₹${parsed.principalAmount || 0}`;
          } else if (r.entity === 'capital') {
            details = `Capital ${parsed.transactionType || ''} of ₹${parsed.amount || 0}`;
          } else if (r.entity === 'borrower') {
            details = `Borrower ${parsed.fullName || ''} registered`;
          }
        } catch {
          details = null;
        }
      }

      return {
        id: r.id,
        timestamp: r.timestamp instanceof Date ? r.timestamp.toISOString() : String(r.timestamp),
        action: r.action,
        entity: r.entity,
        entityId: String(r.entity_id),
        user: r.user_name,
        details,
      };
    });
  }

  async getOverdueAlert(connection?: PoolConnection): Promise<OverdueAlertItem[]> {
    const conn = connection || getPool();

    const [rows] = await conn.query<RowDataPacket[]>(
      `SELECT
        l.id,
        l.loan_id,
        l.principal_amount,
        l.due_date,
        l.status,
        b.full_name AS borrower_name,
        b.phone AS borrower_phone,
        IFNULL(SUM(p.principal_portion), 0) AS princ_paid
       FROM loans l
       JOIN borrowers b ON b.id = l.borrower_id
       LEFT JOIN payments p ON p.loan_id = l.id AND p.is_void = FALSE
       WHERE l.deleted_at IS NULL AND (
         l.status = 'overdue' OR
         (l.due_date IS NOT NULL AND l.due_date < CURRENT_DATE() AND l.status = 'active')
       )
       GROUP BY l.id
       ORDER BY l.due_date ASC`
    );

    return rows.map((r) => {
      const principal = Number(r.principal_amount || 0);
      const paid = Number(r.princ_paid || 0);
      const outstanding = Math.max(0, principal - paid);

      let daysOverdue = 0;
      if (r.due_date) {
        const due = new Date(r.due_date);
        const today = new Date();
        const diffMs = today.getTime() - due.getTime();
        daysOverdue = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
      }

      return {
        id: r.id,
        loanId: r.loan_id,
        borrowerName: r.borrower_name,
        borrowerPhone: r.borrower_phone,
        principalAmount: principal,
        totalOutstanding: outstanding,
        dueDate: r.due_date ? String(r.due_date).split('T')[0] : null,
        daysOverdue,
      };
    });
  }

  async getAllMetrics(connection?: PoolConnection): Promise<DashboardMetrics> {
    const conn = connection || getPool();

    const [capital, loans, collections, profit, [borrowerRows]] = await Promise.all([
      this.getCapitalMetrics(conn),
      this.getLoanMetrics(conn),
      this.getCollectionMetrics(conn),
      this.getProfitMetrics(conn),
      conn.query<RowDataPacket[]>('SELECT COUNT(id) AS total_borrowers FROM borrowers WHERE deleted_at IS NULL'),
    ]);

    const totalBorrowers = Number(borrowerRows[0]?.total_borrowers || 0);

    return {
      capital,
      loans,
      collections,
      profit,
      registeredBorrowersCount: totalBorrowers,
    };
  }
}

export const dashboardRepository = new DashboardRepository();
export default dashboardRepository;
