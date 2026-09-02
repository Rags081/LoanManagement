import { Document } from 'mongodb';
import { getMongoDb, MONGO_COLLECTIONS } from '../../db/mongodb';
import { generateId, generateNumericId } from '../../id-generator';
import { toLocalDateString } from '../../financial-engine';
import { mongoLoanRepository } from './loan.repository.mongo';
import Decimal from 'decimal.js';
import {
  DbPayment,
  DbPaymentAllocation,
  PaymentCreateDto,
  PaymentFilters,
  PaymentSummaryDto,
} from '../payment.repository';

export class MongoPaymentRepository {
  private async enrichPayment(doc: Document): Promise<DbPayment> {
    const db = await getMongoDb();
    let loanCustomId: string | undefined;
    let borrowerId: number | undefined;
    let borrowerName: string | undefined;
    let borrowerPhone: string | undefined;
    let borrowerIdCode: string | undefined;
    let creatorName: string | undefined;
    let voidedByName: string | undefined;

    if (doc.loan_id) {
      const loan = await db
        .collection(MONGO_COLLECTIONS.LOANS)
        .findOne({ id: Number(doc.loan_id) });
      if (loan) {
        loanCustomId = String(loan.loan_id);
        borrowerId = Number(loan.borrower_id);

        const borrower = await db
          .collection(MONGO_COLLECTIONS.BORROWERS)
          .findOne({ id: borrowerId });
        if (borrower) {
          borrowerName = String(borrower.full_name || '');
          borrowerPhone = String(borrower.phone || '');
          borrowerIdCode = String(borrower.borrower_id || '');
        }
      }
    }

    if (doc.created_by) {
      const creator = await db
        .collection(MONGO_COLLECTIONS.USERS)
        .findOne({ id: Number(doc.created_by) });
      if (creator) creatorName = String(creator.full_name || '');
    }

    if (doc.voided_by) {
      const voider = await db
        .collection(MONGO_COLLECTIONS.USERS)
        .findOne({ id: Number(doc.voided_by) });
      if (voider) voidedByName = String(voider.full_name || '');
    }

    const payDate = toLocalDateString(doc.payment_date as string | Date);
    const createdAt = doc.created_at instanceof Date ? doc.created_at.toISOString() : String(doc.created_at || '');
    const updatedAt = doc.updated_at instanceof Date ? doc.updated_at.toISOString() : String(doc.updated_at || '');
    const voidedAt = doc.voided_at
      ? doc.voided_at instanceof Date
        ? doc.voided_at.toISOString()
        : String(doc.voided_at)
      : null;

    return {
      id: Number(doc.id),
      payment_id: String(doc.payment_id),
      loan_id: Number(doc.loan_id),
      payment_date: payDate,
      payment_amount: Number(doc.payment_amount || 0),
      principal_portion: Number(doc.principal_portion || 0),
      interest_portion: Number(doc.interest_portion || 0),
      payment_mode: doc.payment_mode,
      reference_number: doc.reference_number ? String(doc.reference_number) : null,
      notes: doc.notes ? String(doc.notes) : null,
      is_void: doc.is_void ? 1 : 0,
      void_reason: doc.void_reason ? String(doc.void_reason) : null,
      voided_at: voidedAt,
      voided_by: doc.voided_by !== null && doc.voided_by !== undefined ? Number(doc.voided_by) : null,
      created_by: Number(doc.created_by),
      created_at: createdAt,
      updated_at: updatedAt,
      loan_custom_id: loanCustomId,
      borrower_name: borrowerName,
      borrower_phone: borrowerPhone,
      borrower_id_code: borrowerIdCode,
      borrower_id: borrowerId,
      creator_name: creatorName,
      voided_by_name: voidedByName,
    } as unknown as DbPayment;
  }

  async findById(id: number): Promise<DbPayment | null> {
    const db = await getMongoDb();
    const doc = await db
      .collection(MONGO_COLLECTIONS.PAYMENTS)
      .findOne({ id: Number(id) });
    return doc ? this.enrichPayment(doc) : null;
  }

  async findByPaymentId(paymentId: string): Promise<DbPayment | null> {
    const db = await getMongoDb();
    const doc = await db
      .collection(MONGO_COLLECTIONS.PAYMENTS)
      .findOne({ payment_id: paymentId.trim() });
    return doc ? this.enrichPayment(doc) : null;
  }

  async findAll(
    filters: PaymentFilters = {},
    pagination: { page?: number; limit?: number } = {}
  ): Promise<{ data: DbPayment[]; total: number; page: number; limit: number; totalPages: number }> {
    const db = await getMongoDb();
    const query: Record<string, unknown> = {};

    if (filters.loan_id) {
      query.loan_id = Number(filters.loan_id);
    }
    if (filters.is_void !== undefined) {
      query.is_void = Boolean(filters.is_void);
    }
    if (filters.payment_mode && filters.payment_mode !== 'all') {
      query.payment_mode = filters.payment_mode;
    }

    if (filters.from_date || filters.to_date) {
      const dateQ: Record<string, string> = {};
      if (filters.from_date) dateQ.$gte = filters.from_date;
      if (filters.to_date) dateQ.$lte = filters.to_date;
      query.payment_date = dateQ;
    }

    if (filters.borrower_id) {
      const loans = await db
        .collection(MONGO_COLLECTIONS.LOANS)
        .find({ borrower_id: Number(filters.borrower_id) })
        .project({ id: 1 })
        .toArray();
      const loanIds = loans.map((l) => l.id);
      query.loan_id = { $in: loanIds };
    }

    if (filters.search) {
      const pattern = new RegExp(filters.search.trim(), 'i');
      const matchingBorrowers = await db
        .collection(MONGO_COLLECTIONS.BORROWERS)
        .find({ $or: [{ full_name: pattern }, { phone: pattern }] })
        .project({ id: 1 })
        .toArray();
      const borrowerIds = matchingBorrowers.map((b) => b.id);

      const matchingLoans = await db
        .collection(MONGO_COLLECTIONS.LOANS)
        .find({ $or: [{ loan_id: pattern }, { borrower_id: { $in: borrowerIds } }] })
        .project({ id: 1 })
        .toArray();
      const loanIds = matchingLoans.map((l) => l.id);

      query.$or = [
        { payment_id: pattern },
        { reference_number: pattern },
        { loan_id: { $in: loanIds } },
      ];
    }

    const total = await db.collection(MONGO_COLLECTIONS.PAYMENTS).countDocuments(query);
    const page = Math.max(1, pagination.page || 1);
    const limit = Math.max(1, pagination.limit || 10);
    const skip = (page - 1) * limit;
    const totalPages = Math.ceil(total / limit) || 1;

    const docs = await db
      .collection(MONGO_COLLECTIONS.PAYMENTS)
      .find(query)
      .sort({ payment_date: -1, id: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const data = await Promise.all(docs.map((doc) => this.enrichPayment(doc)));
    return { data, total, page, limit, totalPages };
  }

  async findByLoan(loanId: number): Promise<DbPayment[]> {
    const db = await getMongoDb();
    const docs = await db
      .collection(MONGO_COLLECTIONS.PAYMENTS)
      .find({ loan_id: Number(loanId) })
      .sort({ payment_date: -1, id: -1 })
      .toArray();

    return Promise.all(docs.map((doc) => this.enrichPayment(doc)));
  }

  async getTotalReceivedByLoan(loanId: number): Promise<{ total: number; principalTotal: number; interestTotal: number }> {
    const db = await getMongoDb();
    const docs = await db
      .collection(MONGO_COLLECTIONS.PAYMENTS)
      .find({ loan_id: Number(loanId), is_void: false })
      .toArray();

    let total = 0;
    let principalTotal = 0;
    let interestTotal = 0;

    for (const p of docs) {
      total += Number(p.payment_amount || 0);
      principalTotal += Number(p.principal_portion || 0);
      interestTotal += Number(p.interest_portion || 0);
    }

    return { total, principalTotal, interestTotal };
  }

  async getAllocations(paymentId: number): Promise<DbPaymentAllocation[]> {
    const db = await getMongoDb();
    const docs = await db
      .collection(MONGO_COLLECTIONS.PAYMENT_ALLOCATIONS)
      .find({ payment_id: Number(paymentId) })
      .sort({ id: 1 })
      .toArray();

    return docs.map((d) => ({
      id: Number(d.id),
      payment_id: Number(d.payment_id),
      allocated_to: d.allocated_to,
      amount: Number(d.amount || 0),
      running_principal_balance: Number(d.running_principal_balance || 0),
      running_interest_balance: Number(d.running_interest_balance || 0),
      created_at: d.created_at,
    })) as unknown as DbPaymentAllocation[];
  }

  async create(data: PaymentCreateDto, createdBy: number): Promise<DbPayment> {
    const db = await getMongoDb();
    Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

    const loanId = Number(data.loan_id);
    if (!loanId || isNaN(loanId)) {
      throw new Error('Valid loan_id is required');
    }

    // 1. Calculate live outstanding breakdown on the loan
    const outstanding = await mongoLoanRepository.calculateOutstanding(loanId);

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
        // Proportional allocation
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
    const paymentId = data.payment_id || (await generateId('PAY', MONGO_COLLECTIONS.PAYMENTS, 'payment_id'));
    const nextPayDbId = await generateNumericId(MONGO_COLLECTIONS.PAYMENTS);
    const now = new Date();

    const paymentDoc = {
      id: nextPayDbId,
      payment_id: paymentId,
      loan_id: loanId,
      payment_date: payDate,
      payment_amount: paymentAmount.toNumber(),
      principal_portion: principalPortion.toNumber(),
      interest_portion: interestPortion.toNumber(),
      payment_mode: data.payment_mode,
      reference_number: data.reference_number || null,
      notes: data.notes ? String(data.notes).trim() : null,
      is_void: false,
      void_reason: null,
      voided_at: null,
      voided_by: null,
      created_by: Number(createdBy),
      created_at: now,
      updated_at: now,
    };

    await db.collection(MONGO_COLLECTIONS.PAYMENTS).insertOne(paymentDoc);

    // 4. Create Payment Allocation Records
    if (interestPortion.greaterThan(0)) {
      const allocId1 = await generateNumericId(MONGO_COLLECTIONS.PAYMENT_ALLOCATIONS);
      await db.collection(MONGO_COLLECTIONS.PAYMENT_ALLOCATIONS).insertOne({
        id: allocId1,
        payment_id: nextPayDbId,
        allocated_to: 'interest',
        amount: interestPortion.toNumber(),
        running_principal_balance: remPrincipalBefore.toNumber(),
        running_interest_balance: runningInterest,
        created_at: now,
      });
    }

    if (principalPortion.greaterThan(0)) {
      const allocId2 = await generateNumericId(MONGO_COLLECTIONS.PAYMENT_ALLOCATIONS);
      await db.collection(MONGO_COLLECTIONS.PAYMENT_ALLOCATIONS).insertOne({
        id: allocId2,
        payment_id: nextPayDbId,
        allocated_to: 'principal',
        amount: principalPortion.toNumber(),
        running_principal_balance: runningPrincipal,
        running_interest_balance: runningInterest,
        created_at: now,
      });
    }

    // 5. Automatic Loan Settlement Check
    if (runningPrincipal === 0 && runningInterest === 0) {
      await db.collection(MONGO_COLLECTIONS.LOANS).updateOne(
        { id: loanId, deleted_at: null },
        { $set: { status: 'completed', settlement_date: payDate } }
      );
    }

    // 6. Audit Log
    await db.collection(MONGO_COLLECTIONS.AUDIT_LOGS).insertOne({
      user_id: Number(createdBy),
      action: 'CREATE',
      entity: 'payment',
      entity_id: String(nextPayDbId),
      old_data: null,
      new_data: {
        paymentId,
        loanId,
        paymentAmount: paymentAmount.toNumber(),
        principalPortion: principalPortion.toNumber(),
        interestPortion: interestPortion.toNumber(),
        paymentDate: payDate,
      },
      created_at: now,
    });

    const created = await this.findById(nextPayDbId);
    if (!created) throw new Error('Failed to retrieve newly created payment');
    return created;
  }

  async void(id: number, voidReason: string, voidedBy: number): Promise<DbPayment> {
    const db = await getMongoDb();
    const existing = await this.findById(id);
    if (!existing) throw new Error(`Payment #${id} not found`);

    if (existing.is_void) {
      throw new Error(`Payment "${existing.payment_id}" is already voided`);
    }

    const cleanReason = String(voidReason || '').trim();
    if (!cleanReason) {
      throw new Error('A void reason is required');
    }

    const now = new Date();
    await db.collection(MONGO_COLLECTIONS.PAYMENTS).updateOne(
      { id: Number(id) },
      {
        $set: {
          is_void: true,
          void_reason: cleanReason,
          voided_at: now,
          voided_by: Number(voidedBy),
        },
      }
    );

    // Re-evaluate loan outstanding & settlement status
    const updatedOutstanding = await mongoLoanRepository.calculateOutstanding(existing.loan_id);

    if (updatedOutstanding.totalOutstanding > 0) {
      await db.collection(MONGO_COLLECTIONS.LOANS).updateOne(
        { id: Number(existing.loan_id), deleted_at: null },
        { $set: { status: 'active', settlement_date: null } }
      );
    }

    await db.collection(MONGO_COLLECTIONS.AUDIT_LOGS).insertOne({
      user_id: Number(voidedBy),
      action: 'VOID',
      entity: 'payment',
      entity_id: String(id),
      old_data: { is_void: false, payment_amount: existing.payment_amount },
      new_data: { is_void: true, void_reason: cleanReason, voided_by: voidedBy },
      created_at: now,
    });

    const voided = await this.findById(id);
    if (!voided) throw new Error(`Payment #${id} not found after voiding`);
    return voided;
  }

  async getPaymentSummary(_filters: PaymentFilters = {}): Promise<PaymentSummaryDto> {
    const db = await getMongoDb();
    const allPayments = await db.collection(MONGO_COLLECTIONS.PAYMENTS).find().toArray();

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
    const monthPrefix = `${currentYear}-${currentMonth}`;

    let totalPayments = 0;
    let totalCollected = 0;
    let principalCollected = 0;
    let interestCollected = 0;
    let collectedThisMonth = 0;
    let voidedPaymentsCount = 0;
    let voidedAmount = 0;

    for (const p of allPayments) {
      const pAmt = Number(p.payment_amount || 0);
      const pDate = toLocalDateString(p.payment_date as string | Date);

      if (p.is_void) {
        voidedPaymentsCount++;
        voidedAmount += pAmt;
      } else {
        totalPayments++;
        totalCollected += pAmt;
        principalCollected += Number(p.principal_portion || 0);
        interestCollected += Number(p.interest_portion || 0);
        if (pDate.startsWith(monthPrefix)) {
          collectedThisMonth += pAmt;
        }
      }
    }

    return {
      totalPayments,
      totalCollected,
      principalCollected,
      interestCollected,
      collectedThisMonth,
      voidedPaymentsCount,
      voidedAmount,
    };
  }
}

export const mongoPaymentRepository = new MongoPaymentRepository();
