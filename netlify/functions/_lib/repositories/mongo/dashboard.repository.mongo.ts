import { getMongoDb, MONGO_COLLECTIONS } from '../../db/mongodb';
import { mongoLoanRepository } from './loan.repository.mongo';
import { toLocalDateString, calculateLoanFinancials } from '../../financial-engine';
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
import { Document } from 'mongodb';

export class MongoDashboardRepository {
  async getCapitalMetrics(): Promise<CapitalMetrics> {
    const db = await getMongoDb();

    const [capDocs, loanDocs, payDocs] = await Promise.all([
      db.collection(MONGO_COLLECTIONS.CAPITAL_TRANSACTIONS).find({ deleted_at: null }).toArray(),
      db.collection(MONGO_COLLECTIONS.LOANS).find({ deleted_at: null }).toArray(),
      db.collection(MONGO_COLLECTIONS.PAYMENTS).find({ is_void: false }).toArray(),
    ]);

    let given = 0;
    let returned = 0;
    let adjustments = 0;

    for (const c of capDocs) {
      const amt = Number(c.amount || 0);
      if (c.transaction_type === 'capital_given') given += amt;
      else if (c.transaction_type === 'capital_returned') returned += amt;
      else if (c.transaction_type === 'adjustment') adjustments += amt;
    }

    const netInvestedCapital = given - returned + adjustments;

    let totalLent = 0;
    for (const l of loanDocs) {
      totalLent += Number(l.principal_amount || 0);
    }

    const activeLoanIds = new Set(loanDocs.map((l) => Number(l.id)));
    let totalPrincRec = 0;
    let totalIntRec = 0;

    for (const p of payDocs) {
      if (activeLoanIds.has(Number(p.loan_id))) {
        totalPrincRec += Number(p.principal_portion || 0);
        totalIntRec += Number(p.interest_portion || 0);
      }
    }

    const totalCollections = totalPrincRec + totalIntRec;
    const availableToDisburse = Math.max(0, netInvestedCapital - totalLent + totalCollections);

    return {
      totalGiven: given,
      totalReturned: returned,
      currentBalance: netInvestedCapital,
      unallocated: availableToDisburse,
    };
  }

  async getLoanMetrics(): Promise<LoanMetrics> {
    const db = await getMongoDb();
    const loanDocs = await db
      .collection(MONGO_COLLECTIONS.LOANS)
      .find({ deleted_at: null })
      .toArray();

    const totalLoans = loanDocs.length;
    let activeLoans = 0;
    let overdueLoans = 0;
    let completedLoans = 0;
    let cancelledLoans = 0;
    let totalLent = 0;

    for (const l of loanDocs) {
      totalLent += Number(l.principal_amount || 0);
      if (l.status === 'active') activeLoans++;
      if (l.status === 'overdue') overdueLoans++;
      if (l.status === 'completed') completedLoans++;
      if (l.status === 'cancelled') cancelledLoans++;
    }

    // Partially paid loans
    const activeLoanIds = loanDocs
      .filter((l) => l.status === 'active' || l.status === 'overdue')
      .map((l) => Number(l.id));

    const partiallyPaidSet = new Set<number>();
    if (activeLoanIds.length > 0) {
      const payDocs = await db
        .collection(MONGO_COLLECTIONS.PAYMENTS)
        .find({
          loan_id: { $in: activeLoanIds },
          is_void: false,
          principal_portion: { $gt: 0 },
        })
        .toArray();

      for (const p of payDocs) {
        partiallyPaidSet.add(Number(p.loan_id));
      }
    }

    return {
      totalLoans,
      activeLoans,
      overdueLoans,
      completedLoans,
      cancelledLoans,
      partiallyPaidLoans: partiallyPaidSet.size,
      totalLent,
    };
  }

  async getCollectionMetrics(): Promise<CollectionMetrics> {
    const db = await getMongoDb();
    const [loanDocs, payDocs] = await Promise.all([
      db.collection(MONGO_COLLECTIONS.LOANS).find({ deleted_at: null }).toArray(),
      db.collection(MONGO_COLLECTIONS.PAYMENTS).find({ is_void: false }).sort({ payment_date: 1, id: 1 }).toArray(),
    ]);

    const activeLoanIds = new Set(loanDocs.map((l) => Number(l.id)));
    const paymentsMap = new Map<number, Document[]>();

    let princRec = 0;
    let intRec = 0;
    let totalRec = 0;

    for (const p of payDocs) {
      const lId = Number(p.loan_id);
      if (activeLoanIds.has(lId)) {
        princRec += Number(p.principal_portion || 0);
        intRec += Number(p.interest_portion || 0);
        totalRec += Number(p.payment_amount || 0);
      }
      if (!paymentsMap.has(lId)) paymentsMap.set(lId, []);
      paymentsMap.get(lId)!.push(p);
    }

    const runningLoans = loanDocs.filter((l) => l.status === 'active' || l.status === 'overdue');
    let outstandingPrinc = 0;
    let outstandingInt = 0;
    let totalOutstanding = 0;

    for (const l of runningLoans) {
      const lPayments = paymentsMap.get(Number(l.id)) || [];
      const calc = calculateLoanFinancials(
        {
          id: Number(l.id),
          loanId: String(l.loan_id),
          principalAmount: Number(l.principal_amount || 0),
          interestRate: Number(l.interest_rate || 0),
          interestRateType: l.interest_rate_type || 'monthly',
          loanGivenDate: l.loan_given_date as string | Date,
          dueDate: l.due_date as string | Date | null,
          status: l.status,
          settlementDate: l.settlement_date as string | Date | null,
          total_expected_interest: Number(l.total_expected_interest || 0),
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

  async getProfitMetrics(): Promise<ProfitMetrics> {
    const db = await getMongoDb();
    const [loanDocs, payDocs] = await Promise.all([
      db.collection(MONGO_COLLECTIONS.LOANS).find({ deleted_at: null }).toArray(),
      db.collection(MONGO_COLLECTIONS.PAYMENTS).find({ is_void: false }).sort({ payment_date: 1, id: 1 }).toArray(),
    ]);

    const activeLoanIds = new Set(loanDocs.map((l) => Number(l.id)));
    const paymentsMap = new Map<number, Document[]>();

    let realized = 0;
    for (const p of payDocs) {
      const lId = Number(p.loan_id);
      if (activeLoanIds.has(lId)) {
        realized += Number(p.interest_portion || 0);
      }
      if (!paymentsMap.has(lId)) paymentsMap.set(lId, []);
      paymentsMap.get(lId)!.push(p);
    }

    let totalExpectedInterest = 0;
    for (const l of loanDocs) {
      const lPayments = paymentsMap.get(Number(l.id)) || [];
      const calc = calculateLoanFinancials(
        {
          id: Number(l.id),
          loanId: String(l.loan_id),
          principalAmount: Number(l.principal_amount || 0),
          interestRate: Number(l.interest_rate || 0),
          interestRateType: l.interest_rate_type || 'monthly',
          loanGivenDate: l.loan_given_date as string | Date,
          dueDate: l.due_date as string | Date | null,
          status: l.status,
          settlementDate: l.settlement_date as string | Date | null,
          total_expected_interest: Number(l.total_expected_interest || 0),
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

  async getLoansOverTime(period: 'daily' | 'weekly' | 'monthly' = 'monthly'): Promise<LoanTrendPoint[]> {
    const db = await getMongoDb();
    const loanDocs = await db
      .collection(MONGO_COLLECTIONS.LOANS)
      .find({ deleted_at: null })
      .sort({ loan_given_date: 1 })
      .toArray();

    const periodMap: Record<string, { count: number; amount: number }> = {};

    for (const l of loanDocs) {
      const d = toLocalDateString(l.loan_given_date as string | Date);
      let pKey = d.substring(0, 7); // monthly
      if (period === 'daily') pKey = d;

      if (!periodMap[pKey]) periodMap[pKey] = { count: 0, amount: 0 };
      periodMap[pKey].count++;
      periodMap[pKey].amount += Number(l.principal_amount || 0);
    }

    const periods = Object.keys(periodMap).sort();
    return periods.map((p) => ({
      period: p,
      count: periodMap[p].count,
      amount: periodMap[p].amount,
    }));
  }

  async getCollectionsOverTime(period: 'daily' | 'weekly' | 'monthly' = 'monthly'): Promise<CollectionTrendPoint[]> {
    const db = await getMongoDb();
    const payDocs = await db
      .collection(MONGO_COLLECTIONS.PAYMENTS)
      .find({ is_void: false })
      .sort({ payment_date: 1 })
      .toArray();

    const periodMap: Record<string, { principal: number; interest: number; total: number }> = {};

    for (const p of payDocs) {
      const d = toLocalDateString(p.payment_date as string | Date);
      let pKey = d.substring(0, 7);
      if (period === 'daily') pKey = d;

      if (!periodMap[pKey]) periodMap[pKey] = { principal: 0, interest: 0, total: 0 };
      const pAmt = Number(p.payment_amount || 0);
      const pPrinc = Number(p.principal_portion || 0);
      const pInt = Number(p.interest_portion || 0);

      periodMap[pKey].principal += pPrinc;
      periodMap[pKey].interest += pInt;
      periodMap[pKey].total += pAmt;
    }

    const periods = Object.keys(periodMap).sort();
    return periods.map((p) => ({
      period: p,
      principal: periodMap[p].principal,
      interest: periodMap[p].interest,
      total: periodMap[p].total,
    }));
  }

  async getOutstandingTrend(period: 'daily' | 'weekly' | 'monthly' = 'monthly'): Promise<OutstandingTrendPoint[]> {
    const [loansTrend, collectionsTrend] = await Promise.all([
      this.getLoansOverTime(period),
      this.getCollectionsOverTime(period),
    ]);

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

  async getRecentActivity(limit: number = 10): Promise<ActivityLogItem[]> {
    const db = await getMongoDb();
    const logs = await db
      .collection(MONGO_COLLECTIONS.AUDIT_LOGS)
      .find()
      .sort({ created_at: -1, id: -1 })
      .limit(Math.max(1, limit))
      .toArray();

    const userIds = Array.from(new Set(logs.map((l) => Number(l.user_id)).filter(Boolean)));
    const users =
      userIds.length > 0
        ? await db
            .collection(MONGO_COLLECTIONS.USERS)
            .find({ id: { $in: userIds } })
            .toArray()
        : [];

    const userMap = new Map<number, string>();
    for (const u of users) {
      userMap.set(Number(u.id), String(u.full_name || ''));
    }

    return logs.map((r) => {
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

      const timestamp = r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at || '');

      return {
        id: Number(r.id || 0),
        timestamp,
        action: String(r.action),
        entity: String(r.entity),
        entityId: String(r.entity_id),
        user: userMap.get(Number(r.user_id)) || 'System',
        details,
      };
    });
  }

  async getOverdueAlert(): Promise<OverdueAlertItem[]> {
    const overdueLoans = await mongoLoanRepository.getOverdueLoans();
    return overdueLoans.map((l) => ({
      id: l.id,
      loanId: l.loanId,
      borrowerName: l.borrowerName,
      borrowerPhone: l.borrowerPhone,
      principalAmount: l.principalAmount,
      totalOutstanding: l.totalOutstanding,
      dueDate: l.dueDate,
      daysOverdue: l.daysOverdue,
    }));
  }

  async getAllMetrics(): Promise<DashboardMetrics> {
    const db = await getMongoDb();

    // Fetch all 4 core collections concurrently in single roundtrip
    const [capDocs, loanDocs, payDocs, totalBorrowers] = await Promise.all([
      db.collection(MONGO_COLLECTIONS.CAPITAL_TRANSACTIONS).find({ deleted_at: null }).toArray(),
      db.collection(MONGO_COLLECTIONS.LOANS).find({ deleted_at: null }).toArray(),
      db.collection(MONGO_COLLECTIONS.PAYMENTS).find({ is_void: false }).sort({ payment_date: 1, id: 1 }).toArray(),
      db.collection(MONGO_COLLECTIONS.BORROWERS).countDocuments({ deleted_at: null }),
    ]);

    // 1. Capital Metrics
    let given = 0;
    let returned = 0;
    let adjustments = 0;
    for (const c of capDocs) {
      const amt = Number(c.amount || 0);
      if (c.transaction_type === 'capital_given') given += amt;
      else if (c.transaction_type === 'capital_returned') returned += amt;
      else if (c.transaction_type === 'adjustment') adjustments += amt;
    }
    const netInvestedCapital = given - returned + adjustments;

    // 2. Loans & Payments processing
    let totalLent = 0;
    let activeLoans = 0;
    let overdueLoans = 0;
    let completedLoans = 0;
    let cancelledLoans = 0;

    for (const l of loanDocs) {
      totalLent += Number(l.principal_amount || 0);
      if (l.status === 'active') activeLoans++;
      if (l.status === 'overdue') overdueLoans++;
      if (l.status === 'completed') completedLoans++;
      if (l.status === 'cancelled') cancelledLoans++;
    }

    const activeLoanIds = new Set(loanDocs.map((l) => Number(l.id)));
    const paymentsMap = new Map<number, Document[]>();
    const partiallyPaidSet = new Set<number>();

    let princRec = 0;
    let intRec = 0;
    let totalRec = 0;

    for (const p of payDocs) {
      const lId = Number(p.loan_id);
      const pAmt = Number(p.payment_amount || 0);
      const pPrinc = Number(p.principal_portion || 0);
      const pInt = Number(p.interest_portion || 0);

      if (activeLoanIds.has(lId)) {
        princRec += pPrinc;
        intRec += pInt;
        totalRec += pAmt;
        if (pPrinc > 0) {
          partiallyPaidSet.add(lId);
        }
      }

      if (!paymentsMap.has(lId)) paymentsMap.set(lId, []);
      paymentsMap.get(lId)!.push(p);
    }

    // 3. Outstanding & Expected Interest calculation in-memory
    let outstandingPrinc = 0;
    let outstandingInt = 0;
    let totalOutstanding = 0;
    let totalExpectedInterest = 0;

    for (const l of loanDocs) {
      const lPayments = paymentsMap.get(Number(l.id)) || [];
      const calc = calculateLoanFinancials(
        {
          id: Number(l.id),
          loanId: String(l.loan_id),
          principalAmount: Number(l.principal_amount || 0),
          interestRate: Number(l.interest_rate || 0),
          interestRateType: l.interest_rate_type || 'monthly',
          loanGivenDate: l.loan_given_date as string | Date,
          dueDate: l.due_date as string | Date | null,
          status: l.status,
          settlementDate: l.settlement_date as string | Date | null,
          total_expected_interest: Number(l.total_expected_interest || 0),
        },
        lPayments,
        new Date()
      );

      totalExpectedInterest += calc.interestExpected;

      if (l.status === 'active' || l.status === 'overdue') {
        outstandingPrinc += calc.principalOutstanding;
        outstandingInt += calc.interestOutstanding;
        totalOutstanding += calc.totalOutstanding;
      }
    }

    const totalCollections = princRec + intRec;
    const availableToDisburse = Math.max(0, netInvestedCapital - totalLent + totalCollections);
    const pendingInterest = Math.max(0, totalExpectedInterest - intRec);

    return {
      capital: {
        totalGiven: given,
        totalReturned: returned,
        currentBalance: netInvestedCapital,
        unallocated: availableToDisburse,
      },
      loans: {
        totalLoans: loanDocs.length,
        activeLoans,
        overdueLoans,
        completedLoans,
        cancelledLoans,
        partiallyPaidLoans: partiallyPaidSet.size,
        totalLent,
      },
      collections: {
        totalPrincipalReceived: princRec,
        totalInterestReceived: intRec,
        totalAmountReceived: totalRec,
        outstandingPrincipal: outstandingPrinc,
        outstandingInterest: outstandingInt,
        totalOutstanding,
      },
      profit: {
        expectedInterest: Math.round(totalExpectedInterest * 100) / 100,
        realizedInterest: Math.round(intRec * 100) / 100,
        pendingInterest: Math.round(pendingInterest * 100) / 100,
      },
      registeredBorrowersCount: totalBorrowers,
    };
  }
}

export const mongoDashboardRepository = new MongoDashboardRepository();

