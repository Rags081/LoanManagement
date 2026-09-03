import { Document } from 'mongodb';
import { getMongoDb, MONGO_COLLECTIONS } from '../../db/mongodb';
import { generateId, generateNumericId } from '../../id-generator';
import {
  calculateLoanFinancials,
  toLocalDateString,
  calculateMonthlyInterest,
  calculateDailyInterest,
  CalculatedOutstandingResult,
} from '../../financial-engine';
import {
  MappedLoan,
  InterestPaymentDetail,
  LoanCreateDto,
  LoanUpdateDto,
  LoanFilterOptions,
  LoanSummary,
  PaginationOptions,
} from '../loan.repository';

export class MongoLoanRepository {
  private async enrichLoan(
    doc: Document,
    interestDetails: InterestPaymentDetail[] = []
  ): Promise<MappedLoan> {
    const db = await getMongoDb();
    let borrowerName: string | undefined;
    let borrowerPhone: string | undefined;
    let borrowerIdCode: string | undefined;
    let creatorName: string | undefined;

    if (doc.borrower_id) {
      const borrower = await db
        .collection(MONGO_COLLECTIONS.BORROWERS)
        .findOne({ id: Number(doc.borrower_id) });
      if (borrower) {
        borrowerName = String(borrower.full_name || '');
        borrowerPhone = String(borrower.phone || '');
        borrowerIdCode = String(borrower.borrower_id || '');
      }
    }

    if (doc.created_by) {
      const creator = await db
        .collection(MONGO_COLLECTIONS.USERS)
        .findOne({ id: Number(doc.created_by) });
      if (creator) creatorName = String(creator.full_name || '');
    }

    // Fetch payments for aggregated fields and interest detail list
    const payments = await db
      .collection(MONGO_COLLECTIONS.PAYMENTS)
      .find({ loan_id: Number(doc.id), is_void: false })
      .sort({ payment_date: 1, id: 1 })
      .toArray();

    let totalReceived = 0;
    let principalReceived = 0;
    let interestReceived = 0;
    let lastPaymentDate: string | null = null;
    const computedInterestDetails: InterestPaymentDetail[] = [];

    for (const p of payments) {
      const pAmt = Number(p.payment_amount || 0);
      const pPrinc = Number(p.principal_portion || 0);
      const pInt = Number(p.interest_portion || 0);
      const pDate = toLocalDateString(p.payment_date as string | Date);

      totalReceived += pAmt;
      principalReceived += pPrinc;
      interestReceived += pInt;
      lastPaymentDate = pDate;

      if (pInt > 0) {
        computedInterestDetails.push({
          id: Number(p.id),
          paymentId: String(p.payment_id),
          receiptNumber: String(p.payment_id),
          paymentDate: pDate,
          interestPortion: pInt,
          paymentAmount: pAmt,
          paymentMode: String(p.payment_mode || ''),
        });
      }
    }

    const principal = Number(doc.principal_amount || 0);
    const rate = Number(doc.interest_rate || 0);
    const rateType = (doc.interest_rate_type || 'monthly') as 'monthly' | 'daily' | 'flat';
    const monthlyInterestAmount = calculateMonthlyInterest(principal, rate, rateType);
    const dailyInterestAmount = calculateDailyInterest(principal, rate, rateType);

    // Call shared pure calculation engine
    const financials = calculateLoanFinancials(
      {
        id: Number(doc.id),
        loanId: String(doc.loan_id),
        principalAmount: principal,
        interestRate: rate,
        interestRateType: rateType,
        loanGivenDate: doc.loan_given_date as string | Date,
        dueDate: doc.due_date as string | Date | null,
        status: doc.status,
        settlementDate: doc.settlement_date as string | Date | null,
        total_expected_interest: Number(doc.total_expected_interest || 0),
      },
      payments,
      new Date()
    );

    const givenDate = toLocalDateString(doc.loan_given_date as string | Date);
    const dueDate = doc.due_date ? toLocalDateString(doc.due_date as string | Date) : null;
    const createdAt = doc.created_at instanceof Date ? doc.created_at.toISOString() : String(doc.created_at || '');
    const updatedAt = doc.updated_at instanceof Date ? doc.updated_at.toISOString() : String(doc.updated_at || '');
    const deletedAt = doc.deleted_at
      ? doc.deleted_at instanceof Date
        ? doc.deleted_at.toISOString()
        : String(doc.deleted_at)
      : null;

    const details = interestDetails.length > 0 ? interestDetails : computedInterestDetails;

    return {
      id: Number(doc.id),
      loanId: String(doc.loan_id),
      loan_id: String(doc.loan_id),
      borrowerId: Number(doc.borrower_id),
      borrower_id: Number(doc.borrower_id),
      borrowerName,
      borrower_name: borrowerName,
      borrowerPhone,
      borrower_phone: borrowerPhone,
      borrowerIdCode,
      borrower_id_code: borrowerIdCode,
      principalAmount: principal,
      principal_amount: principal,
      interestRate: rate,
      interest_rate: rate,
      interestRateType: rateType,
      interest_rate_type: rateType,
      tenure: doc.tenure !== null && doc.tenure !== undefined ? Number(doc.tenure) : null,
      tenure_unit: doc.tenure_unit || null,
      loanGivenDate: givenDate,
      loan_given_date: givenDate,
      dueDate,
      due_date: dueDate,
      status: financials.isCompleted ? 'completed' : doc.status,
      settlementDate: financials.settlementDate,
      settlement_date: financials.settlementDate,
      totalExpectedInterest: financials.interestExpected,
      total_expected_interest: financials.interestExpected,
      totalExpectedRepayment: financials.totalExpected,
      total_expected_repayment: financials.totalExpected,
      monthlyInterestAmount,
      dailyInterestAmount,
      notes: doc.notes ? String(doc.notes) : null,
      createdBy: Number(doc.created_by),
      created_by: Number(doc.created_by),
      creatorName,
      creator_name: creatorName,
      createdAt,
      created_at: createdAt,
      updatedAt,
      updated_at: updatedAt,
      deletedAt,
      deleted_at: deletedAt,
      // Aggregated payment fields
      totalReceived,
      total_received: totalReceived,
      principalReceived,
      principal_received: principalReceived,
      interestReceived,
      interest_received: interestReceived,
      lastPaymentDate,
      last_payment_date: lastPaymentDate,
      // Calculated dynamic ledger fields
      principalOutstanding: financials.principalOutstanding,
      interestOutstanding: financials.interestOutstanding,
      totalOutstanding: financials.totalOutstanding,
      accruedInterest: financials.accruedInterest,
      isOverdue: financials.isOverdue,
      daysOverdue: financials.daysOverdue,
      elapsedDays: financials.elapsedDays,
      elapsedTenure: financials.elapsedTenure,
      actualTenure: financials.actualTenure,
      isSettled: financials.isCompleted,
      isCompleted: financials.isCompleted,
      interestPaymentDetails: details,
    };
  }

  async findById(id: number): Promise<MappedLoan | null> {
    const db = await getMongoDb();
    const doc = await db
      .collection(MONGO_COLLECTIONS.LOANS)
      .findOne({ id: Number(id), deleted_at: null });
    return doc ? this.enrichLoan(doc) : null;
  }

  async findByLoanId(loanId: string): Promise<MappedLoan | null> {
    const db = await getMongoDb();
    const doc = await db
      .collection(MONGO_COLLECTIONS.LOANS)
      .findOne({ loan_id: loanId.trim(), deleted_at: null });
    return doc ? this.enrichLoan(doc) : null;
  }

  async findByBorrower(borrowerId: number): Promise<MappedLoan[]> {
    const db = await getMongoDb();
    const docs = await db
      .collection(MONGO_COLLECTIONS.LOANS)
      .find({ borrower_id: Number(borrowerId), deleted_at: null })
      .sort({ loan_given_date: -1, id: -1 })
      .toArray();

    return Promise.all(docs.map((doc) => this.enrichLoan(doc)));
  }

  async calculateOutstanding(loanId: number, asOfDate: Date | string = new Date()): Promise<CalculatedOutstandingResult> {
    const db = await getMongoDb();
    const loan = await db
      .collection(MONGO_COLLECTIONS.LOANS)
      .findOne({ id: Number(loanId), deleted_at: null });

    if (!loan) {
      throw new Error(`Loan #${loanId} not found`);
    }

    const payments = await db
      .collection(MONGO_COLLECTIONS.PAYMENTS)
      .find({ loan_id: Number(loanId), is_void: false })
      .sort({ payment_date: 1, id: 1 })
      .toArray();

    const result = calculateLoanFinancials(
      {
        id: Number(loan.id),
        loanId: String(loan.loan_id),
        principalAmount: Number(loan.principal_amount || 0),
        interestRate: Number(loan.interest_rate || 0),
        interestRateType: loan.interest_rate_type || 'monthly',
        loanGivenDate: loan.loan_given_date as string | Date,
        dueDate: loan.due_date as string | Date | null,
        status: loan.status,
        settlementDate: loan.settlement_date as string | Date | null,
        total_expected_interest: Number(loan.total_expected_interest || 0),
      },
      payments,
      asOfDate
    );

    if (result.isCompleted && loan.status !== 'completed') {
      await db.collection(MONGO_COLLECTIONS.LOANS).updateOne(
        { id: Number(loanId), deleted_at: null },
        { $set: { status: 'completed', settlement_date: result.settlementDate } }
      );
    }

    return result;
  }

  async findAll(
    filters: LoanFilterOptions = {},
    pagination: PaginationOptions = {}
  ): Promise<{ data: MappedLoan[]; total: number; page: number; limit: number; totalPages: number }> {
    const db = await getMongoDb();
    const query: Record<string, unknown> = { deleted_at: null };

    if (filters.status && filters.status !== 'all') {
      query.status = filters.status;
    }
    if (filters.borrowerId) {
      query.borrower_id = Number(filters.borrowerId);
    }
    if (filters.interestRateType) {
      query.interest_rate_type = filters.interestRateType;
    }

    if (filters.search) {
      const pattern = new RegExp(filters.search.trim(), 'i');
      // Search matching borrowers first
      const matchingBorrowers = await db
        .collection(MONGO_COLLECTIONS.BORROWERS)
        .find({ $or: [{ full_name: pattern }, { phone: pattern }, { borrower_id: pattern }] })
        .project({ id: 1 })
        .toArray();

      const matchingBorrowerIds = matchingBorrowers.map((b) => b.id);
      query.$or = [{ loan_id: pattern }, { borrower_id: { $in: matchingBorrowerIds } }];
    }

    const total = await db.collection(MONGO_COLLECTIONS.LOANS).countDocuments(query);
    const page = Math.max(1, pagination.page || 1);
    const limit = Math.max(1, pagination.limit || 10);
    const skip = (page - 1) * limit;
    const totalPages = Math.ceil(total / limit) || 1;

    const docs = await db
      .collection(MONGO_COLLECTIONS.LOANS)
      .find(query)
      .sort({ id: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const data = await Promise.all(docs.map((doc) => this.enrichLoan(doc)));
    return { data, total, page, limit, totalPages };
  }

  async create(data: LoanCreateDto, createdBy: number): Promise<MappedLoan> {
    const db = await getMongoDb();
    const borrower = await db
      .collection(MONGO_COLLECTIONS.BORROWERS)
      .findOne({ id: Number(data.borrowerId || data.borrower_id), deleted_at: null });

    if (!borrower) {
      throw new Error(`Borrower #${data.borrowerId || data.borrower_id} not found`);
    }

    const loanId =
      data.loanId ||
      data.loan_id ||
      (await generateId('LN', MONGO_COLLECTIONS.LOANS, 'loan_id'));

    const principal = Number(data.principalAmount || data.principal_amount || 0);
    const rate = Number(data.interestRate || data.interest_rate || 0);
    const rateType = data.interestRateType || data.interest_rate_type || 'monthly';
    const givenDate = toLocalDateString(data.loanGivenDate || data.loan_given_date);
    const dueDate = data.dueDate || data.due_date ? toLocalDateString(data.dueDate || data.due_date) : null;

    const nextId = await generateNumericId(MONGO_COLLECTIONS.LOANS);
    const now = new Date();

    const record = {
      id: nextId,
      loan_id: loanId,
      borrower_id: Number(borrower.id),
      principal_amount: principal,
      interest_rate: rate,
      interest_rate_type: rateType,
      tenure: data.tenure !== undefined && data.tenure !== null ? Number(data.tenure) : null,
      tenure_unit: data.tenureUnit || data.tenure_unit || null,
      loan_given_date: givenDate,
      due_date: dueDate,
      total_expected_interest: 0,
      total_expected_repayment: principal,
      status: 'active',
      settlement_date: null,
      notes: data.notes ? String(data.notes).trim() : null,
      created_by: Number(createdBy),
      created_at: now,
      updated_at: now,
      deleted_at: null,
    };

    await db.collection(MONGO_COLLECTIONS.LOANS).insertOne(record);

    await db.collection(MONGO_COLLECTIONS.AUDIT_LOGS).insertOne({
      user_id: Number(createdBy),
      action: 'CREATE',
      entity: 'loan',
      entity_id: String(nextId),
      old_data: null,
      new_data: { ...data, loan_id: loanId },
      created_at: now,
    });

    const created = await this.findById(nextId);
    if (!created) throw new Error('Failed to retrieve newly created loan');
    return created;
  }

  async update(id: number, data: LoanUpdateDto, updatedBy: number): Promise<MappedLoan> {
    const db = await getMongoDb();
    const existing = await this.findById(id);
    if (!existing) throw new Error(`Loan #${id} not found`);

    const setFields: Record<string, unknown> = { updated_at: new Date() };

    if (data.borrowerId !== undefined || data.borrower_id !== undefined) {
      const bId = Number(data.borrowerId || data.borrower_id);
      const borrower = await db
        .collection(MONGO_COLLECTIONS.BORROWERS)
        .findOne({ id: bId, deleted_at: null });
      if (!borrower) throw new Error(`Borrower #${bId} not found`);
      setFields.borrower_id = bId;
    }

    if (data.principalAmount !== undefined || data.principal_amount !== undefined) {
      setFields.principal_amount = Number(data.principalAmount || data.principal_amount);
    }
    if (data.interestRate !== undefined || data.interest_rate !== undefined) {
      setFields.interest_rate = Number(data.interestRate || data.interest_rate);
    }
    if (data.interestRateType !== undefined || data.interest_rate_type !== undefined) {
      setFields.interest_rate_type = data.interestRateType || data.interest_rate_type;
    }
    if (data.tenure !== undefined) {
      setFields.tenure = data.tenure !== null ? Number(data.tenure) : null;
    }
    if (data.tenureUnit !== undefined || data.tenure_unit !== undefined) {
      setFields.tenure_unit = data.tenureUnit || data.tenure_unit || null;
    }
    if (data.loanGivenDate !== undefined || data.loan_given_date !== undefined) {
      setFields.loan_given_date = toLocalDateString(data.loanGivenDate || data.loan_given_date);
    }
    if (data.dueDate !== undefined || data.due_date !== undefined) {
      const d = data.dueDate || data.due_date;
      setFields.due_date = d ? toLocalDateString(d) : null;
    }
    if (data.status !== undefined) setFields.status = data.status;
    if (data.notes !== undefined) setFields.notes = data.notes || null;

    await db
      .collection(MONGO_COLLECTIONS.LOANS)
      .updateOne({ id: Number(id), deleted_at: null }, { $set: setFields });

    await db.collection(MONGO_COLLECTIONS.AUDIT_LOGS).insertOne({
      user_id: Number(updatedBy),
      action: 'UPDATE',
      entity: 'loan',
      entity_id: String(id),
      old_data: existing,
      new_data: data,
      created_at: new Date(),
    });

    const updated = await this.findById(id);
    if (!updated) throw new Error(`Loan #${id} not found after update`);
    return updated;
  }

  async delete(id: number, deletedBy: number): Promise<void> {
    const db = await getMongoDb();
    const existing = await this.findById(id);
    if (!existing) throw new Error(`Loan #${id} not found`);

    const paymentsCount = await db
      .collection(MONGO_COLLECTIONS.PAYMENTS)
      .countDocuments({ loan_id: Number(id), is_void: false });

    if (paymentsCount > 0) {
      throw new Error(`Cannot delete loan "${existing.loanId}" because it has ${paymentsCount} recorded payment(s).`);
    }

    const now = new Date();
    await db
      .collection(MONGO_COLLECTIONS.LOANS)
      .updateOne({ id: Number(id), deleted_at: null }, { $set: { deleted_at: now } });

    await db.collection(MONGO_COLLECTIONS.AUDIT_LOGS).insertOne({
      user_id: Number(deletedBy),
      action: 'DELETE',
      entity: 'loan',
      entity_id: String(id),
      old_data: existing,
      new_data: null,
      created_at: now,
    });
  }

  async updateStatus(
    id: number,
    status: 'active' | 'overdue' | 'completed' | 'cancelled',
    updatedBy: number
  ): Promise<MappedLoan> {
    const db = await getMongoDb();
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error(`Loan #${id} not found`);
    }

    const today = toLocalDateString(new Date());
    const settlementDate = status === 'completed'
      ? (existing.settlementDate || existing.lastPaymentDate || today)
      : null;

    const now = new Date();
    const setFields: Record<string, unknown> = {
      status,
      settlement_date: settlementDate,
      updated_at: now,
    };

    await db
      .collection(MONGO_COLLECTIONS.LOANS)
      .updateOne({ id: Number(id), deleted_at: null }, { $set: setFields });

    await db.collection(MONGO_COLLECTIONS.AUDIT_LOGS).insertOne({
      user_id: Number(updatedBy),
      action: 'UPDATE_STATUS',
      entity: 'loan',
      entity_id: String(id),
      old_data: { status: existing.status, settlement_date: existing.settlementDate },
      new_data: { status, settlement_date: settlementDate },
      created_at: now,
    });

    const updated = await this.findById(id);
    if (!updated) throw new Error(`Loan #${id} not found after status update`);
    return updated;
  }

  async softDelete(id: number, deletedBy: number): Promise<void> {
    return this.delete(id, deletedBy);
  }

  async getLoanPayments(loanId: number): Promise<Document[]> {
    const db = await getMongoDb();
    const payments = await db
      .collection(MONGO_COLLECTIONS.PAYMENTS)
      .find({ loan_id: Number(loanId) })
      .sort({ payment_date: -1, id: -1 })
      .toArray();

    return payments.map((p) => ({
      id: Number(p.id),
      payment_id: String(p.payment_id || ''),
      receipt_number: String(p.receipt_number || p.payment_id || ''),
      reference_number: p.reference_number ? String(p.reference_number) : null,
      payment_date: toLocalDateString(p.payment_date as string | Date),
      payment_amount: Number(p.payment_amount || 0),
      principal_portion: Number(p.principal_portion || 0),
      interest_portion: Number(p.interest_portion || 0),
      payment_mode: String(p.payment_mode || ''),
      is_void: Boolean(p.is_void),
      notes: p.notes ? String(p.notes) : null,
      created_at: p.created_at instanceof Date ? p.created_at.toISOString() : String(p.created_at || ''),
    }));
  }

  async getLoanSummary(filters: LoanFilterOptions = {}): Promise<LoanSummary> {
    const db = await getMongoDb();
    const query: Record<string, unknown> = { deleted_at: null };
    if (filters.status && filters.status !== 'all') {
      query.status = filters.status;
    }
    if (filters.borrowerId) {
      query.borrower_id = Number(filters.borrowerId);
    }
    if (filters.interestRateType) {
      query.interest_rate_type = filters.interestRateType;
    }

    const loans = await db.collection(MONGO_COLLECTIONS.LOANS).find(query).toArray();
    let totalPrincipalLent = 0;
    let activeLoans = 0;
    let overdueLoans = 0;
    let completedLoans = 0;
    let cancelledLoans = 0;

    for (const l of loans) {
      totalPrincipalLent += Number(l.principal_amount || 0);
      if (l.status === 'active') activeLoans++;
      if (l.status === 'overdue') overdueLoans++;
      if (l.status === 'completed') completedLoans++;
      if (l.status === 'cancelled') cancelledLoans++;
    }

    let totalExpectedInterest = 0;
    for (const l of loans) {
      const calc = await this.calculateOutstanding(Number(l.id));
      totalExpectedInterest += calc.interestExpected;
    }
    totalExpectedInterest = Math.round(totalExpectedInterest * 100) / 100;

    // Money received
    const loanIds = loans.map((l) => Number(l.id));
    let totalReceived = 0;
    let principalCollected = 0;
    let interestCollected = 0;

    if (loanIds.length > 0) {
      const payments = await db
        .collection(MONGO_COLLECTIONS.PAYMENTS)
        .find({ loan_id: { $in: loanIds }, is_void: false })
        .toArray();

      for (const p of payments) {
        totalReceived += Number(p.payment_amount || 0);
        principalCollected += Number(p.principal_portion || 0);
        interestCollected += Number(p.interest_portion || 0);
      }
    }

    const principalOutstanding = Math.max(0, totalPrincipalLent - principalCollected);

    return {
      totalLoans: loans.length,
      activeLoans,
      overdueLoans,
      completedLoans,
      cancelledLoans,
      totalPrincipalLent,
      totalExpectedInterest,
      totalExpectedRepayment: totalPrincipalLent + totalExpectedInterest,
      totalPrincipalRecovered: principalCollected,
      totalInterestRecovered: interestCollected,
      totalOutstanding: principalOutstanding,
      // Backward-compatibility aliases
      totalLent: totalPrincipalLent,
      totalReceived,
      principalCollected,
      interestCollected,
      principalOutstanding,
    } as LoanSummary;
  }

  async getOverdueLoans(asOfDate?: Date | string): Promise<MappedLoan[]> {
    const db = await getMongoDb();
    const today = toLocalDateString(asOfDate || new Date());
    const docs = await db
      .collection(MONGO_COLLECTIONS.LOANS)
      .find({
        deleted_at: null,
        due_date: { $ne: null, $lt: today },
        status: { $in: ['active', 'overdue'] },
      })
      .toArray();

    const mapped = await Promise.all(docs.map((doc) => this.enrichLoan(doc)));
    return mapped.filter((l) => l.totalOutstanding > 0);
  }
}

export const mongoLoanRepository = new MongoLoanRepository();
