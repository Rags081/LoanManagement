import { getMongoDb, MONGO_COLLECTIONS } from '../../db/mongodb';
import { mongoLoanRepository } from './loan.repository.mongo';
import { toLocalDateString } from '../../financial-engine';
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

    const borrowers = await db.collection(MONGO_COLLECTIONS.BORROWERS).find().toArray();
    const borrowerMap = new Map<number, { full_name?: string; phone?: string }>();
    for (const b of borrowers) borrowerMap.set(Number(b.id), b);

    const result: LoanReportItem[] = [];

    for (const r of docs) {
      const b = borrowerMap.get(Number(r.borrower_id));
      const calc = await mongoLoanRepository.calculateOutstanding(Number(r.id));

      result.push({
        id: Number(r.id),
        loanId: String(r.loan_id),
        borrowerName: b?.full_name || '',
        borrowerPhone: b?.phone || '',
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
      });
    }

    return result;
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

    const borrowers = await db
      .collection(MONGO_COLLECTIONS.BORROWERS)
      .find(query)
      .sort({ full_name: 1 })
      .toArray();

    const allLoans = await db.collection(MONGO_COLLECTIONS.LOANS).find({ deleted_at: null }).toArray();
    const allPayments = await db.collection(MONGO_COLLECTIONS.PAYMENTS).find({ is_void: false }).toArray();

    const loanPaymentMap = new Map<number, { principal: number; total: number }>();
    for (const p of allPayments) {
      const lId = Number(p.loan_id);
      if (!loanPaymentMap.has(lId)) loanPaymentMap.set(lId, { principal: 0, total: 0 });
      loanPaymentMap.get(lId)!.principal += Number(p.principal_portion || 0);
      loanPaymentMap.get(lId)!.total += Number(p.payment_amount || 0);
    }

    const borrowerLoansMap = new Map<number, Array<{ id: number; principal_amount?: number; status?: string }>>();
    for (const l of allLoans) {
      const bId = Number(l.borrower_id);
      if (!borrowerLoansMap.has(bId)) borrowerLoansMap.set(bId, []);
      borrowerLoansMap.get(bId)!.push({ id: Number(l.id), principal_amount: Number(l.principal_amount), status: l.status });
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
          const calc = await mongoLoanRepository.calculateOutstanding(Number(l.id));
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

    const loans = await db.collection(MONGO_COLLECTIONS.LOANS).find().toArray();
    const loanMap = new Map<number, { loan_id?: string; borrower_id?: number }>();
    for (const l of loans) loanMap.set(Number(l.id), { loan_id: l.loan_id, borrower_id: Number(l.borrower_id) });

    const borrowers = await db.collection(MONGO_COLLECTIONS.BORROWERS).find().toArray();
    const borrowerMap = new Map<number, { full_name?: string }>();
    for (const b of borrowers) borrowerMap.set(Number(b.id), { full_name: b.full_name });

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
        loanId: loan?.loan_id || '',
        borrowerName: borrower?.full_name || '',
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

    const borrowers = await db.collection(MONGO_COLLECTIONS.BORROWERS).find().toArray();
    const borrowerMap = new Map<number, { full_name?: string; phone?: string }>();
    for (const b of borrowers) borrowerMap.set(Number(b.id), { full_name: b.full_name, phone: b.phone });

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

      const calc = await mongoLoanRepository.calculateOutstanding(Number(r.id));
      if (calc.totalOutstanding > 0) {
        result.push({
          id: Number(r.id),
          loanId: String(r.loan_id),
          borrowerName: b?.full_name || '',
          borrowerPhone: b?.phone || '',
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

    const payDocs = await db.collection(MONGO_COLLECTIONS.PAYMENTS).find(query).toArray();
    const loanDocs = await db.collection(MONGO_COLLECTIONS.LOANS).find({ deleted_at: null }).toArray();

    const periodMap = new Map<string, { expected: number; realized: number }>();

    for (const l of loanDocs) {
      const p = toLocalDateString(l.loan_given_date as string | Date).substring(0, 7);
      if (!periodMap.has(p)) periodMap.set(p, { expected: 0, realized: 0 });
      const calc = await mongoLoanRepository.calculateOutstanding(Number(l.id));
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
