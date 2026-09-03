import { getMongoDb, MONGO_COLLECTIONS } from '../../db/mongodb';
import { mongoLoanRepository } from './loan.repository.mongo';
import { toLocalDateString, calculateLoanFinancials } from '../../financial-engine';
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
import { Document } from 'mongodb';

export class MongoReportRepository {
  /**
   * 1. Capital Statement Report
   */
  async getCapitalStatement(filters: ReportFilterParams = {}): Promise<CapitalStatementItem[]> {
    const db = await getMongoDb();
    const query: Record<string, unknown> = { deleted_at: null };

    if (filters.startDate || filters.endDate) {
      const dateQ: Record<string, string> = {};
      if (filters.startDate) dateQ.$gte = filters.startDate;
      if (filters.endDate) dateQ.$lte = filters.endDate;
      query.transaction_date = dateQ;
    }

    if (filters.search) {
      const pattern = new RegExp(filters.search.trim(), 'i');
      query.$or = [
        { transaction_id: pattern },
        { source: pattern },
        { destination: pattern },
        { description: pattern },
        { reference_number: pattern },
      ];
    }

    const docs = await db
      .collection(MONGO_COLLECTIONS.CAPITAL_TRANSACTIONS)
      .find(query)
      .sort({ transaction_date: 1, id: 1 })
      .toArray();

    return docs.map((r) => ({
      id: Number(r.id),
      transactionId: String(r.transaction_id),
      transactionDate: toLocalDateString(r.transaction_date as string | Date),
      transactionType: r.transaction_type,
      amount: Number(r.amount || 0),
      source: r.source ? String(r.source) : null,
      destination: r.destination ? String(r.destination) : null,
      runningBalance: Number(r.running_balance || 0),
      description: r.description ? String(r.description) : null,
      referenceNumber: r.reference_number ? String(r.reference_number) : null,
    }));
  }

  /**
   * 2. Loan Portfolio Report
   */
  async getLoanReport(filters: ReportFilterParams = {}): Promise<LoanReportItem[]> {
    const db = await getMongoDb();
    const query: Record<string, unknown> = { deleted_at: null };

    if (filters.status && filters.status !== 'all') {
      query.status = filters.status;
    }
    if (filters.borrowerId) {
      query.borrower_id = Number(filters.borrowerId);
    }
    if (filters.startDate || filters.endDate) {
      const dateQ: Record<string, string> = {};
      if (filters.startDate) dateQ.$gte = filters.startDate;
      if (filters.endDate) dateQ.$lte = filters.endDate;
      query.loan_given_date = dateQ;
    }

    if (filters.search) {
      const pattern = new RegExp(filters.search.trim(), 'i');
      const matchingBorrowers = await db
        .collection(MONGO_COLLECTIONS.BORROWERS)
        .find({ $or: [{ full_name: pattern }, { phone: pattern }] })
        .project({ id: 1 })
        .toArray();
      const bIds = matchingBorrowers.map((b) => b.id);
      query.$or = [{ loan_id: pattern }, { borrower_id: { $in: bIds } }];
    }

    const docs = await db
      .collection(MONGO_COLLECTIONS.LOANS)
      .find(query)
      .sort({ loan_given_date: -1, id: -1 })
      .toArray();

    if (docs.length === 0) return [];

    const borrowerIds = Array.from(new Set(docs.map((d) => Number(d.borrower_id)).filter(Boolean)));
    const loanIds = docs.map((d) => Number(d.id)).filter(Boolean);

    const [borrowers, payments] = await Promise.all([
      borrowerIds.length > 0
        ? db.collection(MONGO_COLLECTIONS.BORROWERS).find({ id: { $in: borrowerIds } }).toArray()
        : [],
      loanIds.length > 0
        ? db.collection(MONGO_COLLECTIONS.PAYMENTS).find({ loan_id: { $in: loanIds }, is_void: false }).sort({ payment_date: 1, id: 1 }).toArray()
        : [],
    ]);

    const borrowerMap = new Map<number, Document>();
    for (const b of borrowers) borrowerMap.set(Number(b.id), b);

    const paymentsMap = new Map<number, Document[]>();
    for (const p of payments) {
      const lId = Number(p.loan_id);
      if (!paymentsMap.has(lId)) paymentsMap.set(lId, []);
      paymentsMap.get(lId)!.push(p);
    }

    return docs.map((r) => {
      const b = borrowerMap.get(Number(r.borrower_id));
      const lPayments = paymentsMap.get(Number(r.id)) || [];

      const calc = calculateLoanFinancials(
        {
          id: Number(r.id),
          loanId: String(r.loan_id),
          principalAmount: Number(r.principal_amount || 0),
          interestRate: Number(r.interest_rate || 0),
          interestRateType: r.interest_rate_type || 'monthly',
          loanGivenDate: r.loan_given_date as string | Date,
          dueDate: r.due_date as string | Date | null,
          status: r.status,
          settlementDate: r.settlement_date as string | Date | null,
          total_expected_interest: Number(r.total_expected_interest || 0),
        },
        lPayments,
        new Date()
      );

      return {
        id: Number(r.id),
        loanId: String(r.loan_id),
        borrowerName: b ? String(b.full_name || '') : '',
        borrowerPhone: b ? String(b.phone || '') : '',
        principalAmount: Number(r.principal_amount || 0),
        interestRate: Number(r.interest_rate || 0),
        interestRateType: r.interest_rate_type,
        loanGivenDate: toLocalDateString(r.loan_given_date as string | Date),
        dueDate: r.due_date ? toLocalDateString(r.due_date as string | Date) : null,
        status: calc.isCompleted ? 'completed' : r.status,
        settlementDate: calc.settlementDate,
        tenure: calc.elapsedTenure,
        principalReceived: calc.principalReceived,
        interestReceived: calc.interestReceived,
        totalReceived: calc.totalReceived,
        principalOutstanding: calc.principalOutstanding,
        interestOutstanding: calc.interestOutstanding,
        totalOutstanding: calc.totalOutstanding,
      };
    });
  }

  /**
   * 3. Borrower Directory & Credit Report
   */
  async getBorrowerReport(filters: ReportFilterParams = {}): Promise<BorrowerReportItem[]> {
    const db = await getMongoDb();
    const query: Record<string, unknown> = { deleted_at: null };

    if (filters.search) {
      const pattern = new RegExp(filters.search.trim(), 'i');
      query.$or = [
        { borrower_id: pattern },
        { full_name: pattern },
        { phone: pattern },
        { email: pattern },
      ];
    }

    const [borrowers, allLoans, allPayments] = await Promise.all([
      db.collection(MONGO_COLLECTIONS.BORROWERS).find(query).sort({ full_name: 1 }).toArray(),
      db.collection(MONGO_COLLECTIONS.LOANS).find({ deleted_at: null }).toArray(),
      db.collection(MONGO_COLLECTIONS.PAYMENTS).find({ is_void: false }).sort({ payment_date: 1, id: 1 }).toArray(),
    ]);

    const loanPaymentMap = new Map<number, { principal: number; total: number }>();
    const loanPaymentsListMap = new Map<number, Document[]>();

    for (const p of allPayments) {
      const lId = Number(p.loan_id);
      if (!loanPaymentMap.has(lId)) loanPaymentMap.set(lId, { principal: 0, total: 0 });
      loanPaymentMap.get(lId)!.principal += Number(p.principal_portion || 0);
      loanPaymentMap.get(lId)!.total += Number(p.payment_amount || 0);

      if (!loanPaymentsListMap.has(lId)) loanPaymentsListMap.set(lId, []);
      loanPaymentsListMap.get(lId)!.push(p);
    }

    const borrowerLoansMap = new Map<number, Document[]>();
    for (const l of allLoans) {
      const bId = Number(l.borrower_id);
      if (!borrowerLoansMap.has(bId)) borrowerLoansMap.set(bId, []);
      borrowerLoansMap.get(bId)!.push(l);
    }

    const result: BorrowerReportItem[] = [];

    for (const b of borrowers) {
      const bId = Number(b.id);
      const bLoans = borrowerLoansMap.get(bId) || [];

      const totalLoans = bLoans.length;
      let activeLoans = 0;
      let totalBorrowed = 0;
      let principalRepaid = 0;
      let totalRepaid = 0;
      let totalOutstanding = 0;

      for (const l of bLoans) {
        if (l.status === 'active' || l.status === 'overdue') {
          activeLoans++;
          const lPayments = loanPaymentsListMap.get(Number(l.id)) || [];
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
          totalOutstanding += calc.totalOutstanding;
        }
        totalBorrowed += Number(l.principal_amount || 0);
        const pRec = loanPaymentMap.get(Number(l.id));
        if (pRec) {
          principalRepaid += pRec.principal;
          totalRepaid += pRec.total;
        }
      }

      const principalOutstanding = Math.max(0, totalBorrowed - principalRepaid);

      result.push({
        id: bId,
        borrowerId: String(b.borrower_id),
        fullName: String(b.full_name),
        phone: String(b.phone),
        email: b.email ? String(b.email) : null,
        address: b.address ? String(b.address) : null,
        totalLoans,
        activeLoans,
        totalBorrowed,
        totalRepaid,
        principalOutstanding,
        totalOutstanding,
      });
    }

    return result;
  }

  /**
   * 4. Payment Ledger & Allocation Report
   */
  async getPaymentReport(filters: ReportFilterParams = {}): Promise<PaymentReportItem[]> {
    const db = await getMongoDb();
    const query: Record<string, unknown> = {};

    if (filters.startDate || filters.endDate) {
      const dateQ: Record<string, string> = {};
      if (filters.startDate) dateQ.$gte = filters.startDate;
      if (filters.endDate) dateQ.$lte = filters.endDate;
      query.payment_date = dateQ;
    }
    if (filters.paymentMode && filters.paymentMode !== 'all') {
      query.payment_mode = filters.paymentMode;
    }
    if (filters.status === 'paid') {
      query.is_void = false;
    } else if (filters.status === 'voided') {
      query.is_void = true;
    }
    if (filters.loanId) {
      query.loan_id = Number(filters.loanId);
    }

    const docs = await db
      .collection(MONGO_COLLECTIONS.PAYMENTS)
      .find(query)
      .sort({ payment_date: -1, id: -1 })
      .toArray();

    if (docs.length === 0) return [];

    const loanIds = Array.from(new Set(docs.map((p) => Number(p.loan_id)).filter(Boolean)));
    const loans = loanIds.length > 0
      ? await db.collection(MONGO_COLLECTIONS.LOANS).find({ id: { $in: loanIds } }).toArray()
      : [];

    const loanMap = new Map<number, Document>();
    const borrowerIds: number[] = [];
    for (const l of loans) {
      loanMap.set(Number(l.id), l);
      if (l.borrower_id) borrowerIds.push(Number(l.borrower_id));
    }

    const borrowers = borrowerIds.length > 0
      ? await db.collection(MONGO_COLLECTIONS.BORROWERS).find({ id: { $in: borrowerIds } }).toArray()
      : [];

    const borrowerMap = new Map<number, Document>();
    for (const b of borrowers) borrowerMap.set(Number(b.id), b);

    const results: PaymentReportItem[] = [];

    for (const p of docs) {
      const loan = loanMap.get(Number(p.loan_id));
      const borrower = loan ? borrowerMap.get(Number(loan.borrower_id)) : null;

      if (filters.borrowerId && loan && Number(loan.borrower_id) !== Number(filters.borrowerId)) {
        continue;
      }

      if (filters.search) {
        const s = filters.search.toLowerCase().trim();
        const matches =
          String(p.payment_id || '').toLowerCase().includes(s) ||
          String(loan?.loan_id || '').toLowerCase().includes(s) ||
          String(borrower?.full_name || '').toLowerCase().includes(s) ||
          String(p.reference_number || '').toLowerCase().includes(s);
        if (!matches) continue;
      }

      results.push({
        id: Number(p.id),
        paymentId: String(p.payment_id),
        paymentDate: toLocalDateString(p.payment_date as string | Date),
        loanId: loan?.loan_id ? String(loan.loan_id) : '',
        borrowerName: borrower ? String(borrower.full_name || '') : '',
        paymentAmount: Number(p.payment_amount || 0),
        principalPortion: Number(p.principal_portion || 0),
        interestPortion: Number(p.interest_portion || 0),
        paymentMode: p.payment_mode,
        referenceNumber: p.reference_number ? String(p.reference_number) : null,
        isVoid: Boolean(p.is_void),
        voidReason: p.void_reason ? String(p.void_reason) : null,
      });
    }

    return results;
  }

  /**
   * 5. Outstanding Portfolio Report
   */
  async getOutstandingReport(filters: ReportFilterParams = {}): Promise<OutstandingReportItem[]> {
    const db = await getMongoDb();
    const docs = await db
      .collection(MONGO_COLLECTIONS.LOANS)
      .find({
        status: { $in: ['active', 'overdue'] },
        deleted_at: null,
      })
      .sort({ principal_amount: -1 })
      .toArray();

    if (docs.length === 0) return [];

    const borrowerIds = Array.from(new Set(docs.map((d) => Number(d.borrower_id)).filter(Boolean)));
    const loanIds = docs.map((d) => Number(d.id)).filter(Boolean);

    const [borrowers, payments] = await Promise.all([
      borrowerIds.length > 0
        ? db.collection(MONGO_COLLECTIONS.BORROWERS).find({ id: { $in: borrowerIds } }).toArray()
        : [],
      loanIds.length > 0
        ? db.collection(MONGO_COLLECTIONS.PAYMENTS).find({ loan_id: { $in: loanIds }, is_void: false }).sort({ payment_date: 1, id: 1 }).toArray()
        : [],
    ]);

    const borrowerMap = new Map<number, Document>();
    for (const b of borrowers) borrowerMap.set(Number(b.id), b);

    const paymentsMap = new Map<number, Document[]>();
    for (const p of payments) {
      const lId = Number(p.loan_id);
      if (!paymentsMap.has(lId)) paymentsMap.set(lId, []);
      paymentsMap.get(lId)!.push(p);
    }

    const result: OutstandingReportItem[] = [];

    for (const r of docs) {
      const b = borrowerMap.get(Number(r.borrower_id));

      if (filters.search) {
        const s = filters.search.toLowerCase().trim();
        const matches =
          String(r.loan_id || '').toLowerCase().includes(s) ||
          String(b?.full_name || '').toLowerCase().includes(s) ||
          String(b?.phone || '').toLowerCase().includes(s);
        if (!matches) continue;
      }

      const lPayments = paymentsMap.get(Number(r.id)) || [];
      const calc = calculateLoanFinancials(
        {
          id: Number(r.id),
          loanId: String(r.loan_id),
          principalAmount: Number(r.principal_amount || 0),
          interestRate: Number(r.interest_rate || 0),
          interestRateType: r.interest_rate_type || 'monthly',
          loanGivenDate: r.loan_given_date as string | Date,
          dueDate: r.due_date as string | Date | null,
          status: r.status,
          settlementDate: r.settlement_date as string | Date | null,
          total_expected_interest: Number(r.total_expected_interest || 0),
        },
        lPayments,
        new Date()
      );

      if (calc.totalOutstanding > 0) {
        result.push({
          id: Number(r.id),
          loanId: String(r.loan_id),
          borrowerName: b ? String(b.full_name || '') : '',
          borrowerPhone: b ? String(b.phone || '') : '',
          principalAmount: Number(r.principal_amount || 0),
          principalOutstanding: calc.principalOutstanding,
          interestOutstanding: calc.interestOutstanding,
          totalOutstanding: calc.totalOutstanding,
          loanGivenDate: toLocalDateString(r.loan_given_date as string | Date),
          daysActive: calc.elapsedDays,
        });
      }
    }

    return result.sort((a, b) => b.totalOutstanding - a.totalOutstanding);
  }

  /**
   * 6. Overdue Delinquency Report
   */
  async getOverdueReport(filters: ReportFilterParams = {}): Promise<OverdueReportItem[]> {
    const overdueLoans = await mongoLoanRepository.getOverdueLoans();
    const result: OverdueReportItem[] = [];

    for (const l of overdueLoans) {
      if (filters.search) {
        const s = filters.search.toLowerCase().trim();
        const matches =
          l.loanId?.toLowerCase().includes(s) ||
          l.borrowerName?.toLowerCase().includes(s) ||
          l.borrowerPhone?.toLowerCase().includes(s);
        if (!matches) continue;
      }

      result.push({
        id: l.id,
        loanId: l.loanId,
        borrowerName: l.borrowerName || '',
        borrowerPhone: l.borrowerPhone || '',
        principalAmount: l.principalAmount,
        totalOutstanding: l.totalOutstanding,
        dueDate: l.dueDate || '',
        daysOverdue: l.daysOverdue,
      });
    }

    return result.sort((a, b) => b.daysOverdue - a.daysOverdue);
  }

  /**
   * 7. Interest & Profit Realization Report
   */
  async getInterestReport(filters: ReportFilterParams = {}): Promise<InterestReportItem[]> {
    const db = await getMongoDb();
    const query: Record<string, unknown> = { is_void: false };

    if (filters.startDate || filters.endDate) {
      const dateQ: Record<string, string> = {};
      if (filters.startDate) dateQ.$gte = filters.startDate;
      if (filters.endDate) dateQ.$lte = filters.endDate;
      query.payment_date = dateQ;
    }

    const [payDocs, loanDocs] = await Promise.all([
      db.collection(MONGO_COLLECTIONS.PAYMENTS).find(query).sort({ payment_date: 1, id: 1 }).toArray(),
      db.collection(MONGO_COLLECTIONS.LOANS).find({ deleted_at: null }).toArray(),
    ]);

    const paymentsMap = new Map<number, Document[]>();
    for (const py of payDocs) {
      const lId = Number(py.loan_id);
      if (!paymentsMap.has(lId)) paymentsMap.set(lId, []);
      paymentsMap.get(lId)!.push(py);
    }

    const periodMap = new Map<string, { expected: number; realized: number }>();

    for (const l of loanDocs) {
      const p = toLocalDateString(l.loan_given_date as string | Date).substring(0, 7);
      if (!periodMap.has(p)) periodMap.set(p, { expected: 0, realized: 0 });

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
      periodMap.get(p)!.expected += calc.interestExpected;
    }

    for (const py of payDocs) {
      const p = toLocalDateString(py.payment_date as string | Date).substring(0, 7);
      if (!periodMap.has(p)) periodMap.set(p, { expected: 0, realized: 0 });
      periodMap.get(p)!.realized += Number(py.interest_portion || 0);
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
  async getMonthlyCollectionReport(year?: number): Promise<MonthlyCollectionItem[]> {
    const db = await getMongoDb();
    const targetYear = year || new Date().getFullYear();
    const yearPrefix = String(targetYear);

    const payDocs = await db
      .collection(MONGO_COLLECTIONS.PAYMENTS)
      .find({
        is_void: false,
        payment_date: { $regex: `^${yearPrefix}-` },
      })
      .toArray();

    const monthMap = new Map<
      number,
      { principal: number; interest: number; total: number; count: number }
    >();

    for (const p of payDocs) {
      const d = toLocalDateString(p.payment_date as string | Date);
      const mNum = parseInt(d.split('-')[1], 10);
      if (!monthMap.has(mNum)) {
        monthMap.set(mNum, { principal: 0, interest: 0, total: 0, count: 0 });
      }
      const data = monthMap.get(mNum)!;
      data.principal += Number(p.principal_portion || 0);
      data.interest += Number(p.interest_portion || 0);
      data.total += Number(p.payment_amount || 0);
      data.count++;
    }

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];

    const sortedMonths = Array.from(monthMap.keys()).sort((a, b) => a - b);
    return sortedMonths.map((mNum) => {
      const d = monthMap.get(mNum)!;
      return {
        month: monthNames[mNum - 1] || `Month ${mNum}`,
        year: targetYear,
        principalCollected: d.principal,
        interestCollected: d.interest,
        totalCollected: d.total,
        paymentCount: d.count,
      };
    });
  }
}

export const mongoReportRepository = new MongoReportRepository();

