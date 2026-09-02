import { Document } from 'mongodb';
import { getMongoDb, MONGO_COLLECTIONS } from '../../db/mongodb';
import { generateId, generateNumericId } from '../../id-generator';
import Decimal from 'decimal.js';
import {
  MappedBorrower,
  BorrowerCreateDto,
  BorrowerUpdateDto,
  BorrowerFilterOptions,
  BorrowerStats,
  BorrowerLoanSummary,
} from '../borrower.repository';

export class MongoBorrowerRepository {
  private async enrichBorrower(doc: Document): Promise<MappedBorrower> {
    const db = await getMongoDb();
    let creatorName: string | undefined = undefined;

    if (doc.created_by) {
      const creator = await db
        .collection(MONGO_COLLECTIONS.USERS)
        .findOne({ id: Number(doc.created_by) });
      if (creator) creatorName = String(creator.full_name || '');
    }

    const createdAt = doc.created_at instanceof Date ? doc.created_at.toISOString() : String(doc.created_at || '');
    const updatedAt = doc.updated_at instanceof Date ? doc.updated_at.toISOString() : String(doc.updated_at || '');
    const deletedAt = doc.deleted_at
      ? doc.deleted_at instanceof Date
        ? doc.deleted_at.toISOString()
        : String(doc.deleted_at)
      : null;

    return {
      id: Number(doc.id),
      borrowerId: String(doc.borrower_id),
      borrower_id: String(doc.borrower_id),
      fullName: String(doc.full_name),
      full_name: String(doc.full_name),
      phone: String(doc.phone),
      email: doc.email ? String(doc.email) : null,
      address: doc.address ? String(doc.address) : null,
      notes: doc.notes ? String(doc.notes) : null,
      status: doc.status || 'active',
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
    };
  }

  async findById(id: number): Promise<MappedBorrower | null> {
    const db = await getMongoDb();
    const doc = await db
      .collection(MONGO_COLLECTIONS.BORROWERS)
      .findOne({ id: Number(id), deleted_at: null });
    return doc ? this.enrichBorrower(doc) : null;
  }

  async findByBorrowerId(borrowerId: string): Promise<MappedBorrower | null> {
    const db = await getMongoDb();
    const doc = await db
      .collection(MONGO_COLLECTIONS.BORROWERS)
      .findOne({ borrower_id: borrowerId.trim(), deleted_at: null });
    return doc ? this.enrichBorrower(doc) : null;
  }

  async findByPhone(phone: string, excludeId?: number): Promise<MappedBorrower | null> {
    const db = await getMongoDb();
    const query: Record<string, unknown> = { phone: phone.trim(), deleted_at: null };
    if (excludeId !== undefined) {
      query.id = { $ne: Number(excludeId) };
    }
    const doc = await db.collection(MONGO_COLLECTIONS.BORROWERS).findOne(query);
    return doc ? this.enrichBorrower(doc) : null;
  }

  async findAll(
    filters: BorrowerFilterOptions = {}
  ): Promise<{ data: MappedBorrower[]; total: number; page: number; limit: number; totalPages: number }> {
    const db = await getMongoDb();
    const query: Record<string, unknown> = { deleted_at: null };

    if (filters.status && filters.status !== 'all') {
      query.status = filters.status;
    }

    if (filters.search) {
      const pattern = new RegExp(filters.search.trim(), 'i');
      query.$or = [
        { borrower_id: pattern },
        { full_name: pattern },
        { phone: pattern },
        { email: pattern },
      ];
    }

    const total = await db.collection(MONGO_COLLECTIONS.BORROWERS).countDocuments(query);

    const page = Math.max(1, filters.page || 1);
    const limit = Math.max(1, filters.limit || 10);
    const skip = (page - 1) * limit;
    const totalPages = Math.ceil(total / limit) || 1;

    const docs = await db
      .collection(MONGO_COLLECTIONS.BORROWERS)
      .find(query)
      .sort({ id: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const data = await Promise.all(docs.map((doc) => this.enrichBorrower(doc)));
    return { data, total, page, limit, totalPages };
  }

  async search(queryText: string, limit = 10): Promise<MappedBorrower[]> {
    const db = await getMongoDb();
    const pattern = new RegExp(queryText.trim(), 'i');
    const docs = await db
      .collection(MONGO_COLLECTIONS.BORROWERS)
      .find({
        deleted_at: null,
        $or: [{ borrower_id: pattern }, { full_name: pattern }, { phone: pattern }],
      })
      .sort({ full_name: 1 })
      .limit(limit)
      .toArray();

    return Promise.all(docs.map((doc) => this.enrichBorrower(doc)));
  }

  async create(data: BorrowerCreateDto, createdBy: number): Promise<MappedBorrower> {
    const db = await getMongoDb();
    const phone = data.phone.trim();
    const existing = await this.findByPhone(phone);
    if (existing) {
      throw new Error(`Phone number "${phone}" is already registered to ${existing.fullName} (${existing.borrowerId})`);
    }

    const borrowerId =
      data.borrowerId ||
      data.borrower_id ||
      (await generateId('BOR', MONGO_COLLECTIONS.BORROWERS, 'borrower_id'));

    const fullName = (data.fullName || data.full_name || '').trim();
    if (!fullName) {
      throw new Error('Borrower full name is required');
    }

    const nextId = await generateNumericId(MONGO_COLLECTIONS.BORROWERS);
    const now = new Date();

    const record = {
      id: nextId,
      borrower_id: borrowerId,
      full_name: fullName,
      phone,
      email: data.email ? String(data.email).trim() : null,
      address: data.address ? String(data.address).trim() : null,
      notes: data.notes ? String(data.notes).trim() : null,
      status: data.status || 'active',
      created_by: Number(createdBy),
      created_at: now,
      updated_at: now,
      deleted_at: null,
    };

    await db.collection(MONGO_COLLECTIONS.BORROWERS).insertOne(record);

    await db.collection(MONGO_COLLECTIONS.AUDIT_LOGS).insertOne({
      user_id: Number(createdBy),
      action: 'CREATE',
      entity: 'borrower',
      entity_id: String(nextId),
      old_data: null,
      new_data: { ...data, borrower_id: borrowerId },
      created_at: now,
    });

    const created = await this.findById(nextId);
    if (!created) throw new Error('Failed to retrieve newly created borrower');
    return created;
  }

  async update(id: number, data: BorrowerUpdateDto, updatedBy: number): Promise<MappedBorrower> {
    const db = await getMongoDb();
    const existing = await this.findById(id);
    if (!existing) throw new Error(`Borrower #${id} not found`);

    if (data.phone) {
      const phone = data.phone.trim();
      const duplicate = await this.findByPhone(phone, id);
      if (duplicate) {
        throw new Error(`Phone number "${phone}" is already in use by another borrower (${duplicate.borrowerId})`);
      }
    }

    const setFields: Record<string, unknown> = { updated_at: new Date() };
    const name = data.fullName !== undefined ? data.fullName : data.full_name;
    if (name !== undefined) setFields.full_name = name.trim();
    if (data.phone !== undefined) setFields.phone = data.phone.trim();
    if (data.email !== undefined) setFields.email = data.email ? String(data.email).trim() : null;
    if (data.address !== undefined) setFields.address = data.address ? String(data.address).trim() : null;
    if (data.notes !== undefined) setFields.notes = data.notes ? String(data.notes).trim() : null;
    if (data.status !== undefined) setFields.status = data.status;

    await db
      .collection(MONGO_COLLECTIONS.BORROWERS)
      .updateOne({ id: Number(id), deleted_at: null }, { $set: setFields });

    await db.collection(MONGO_COLLECTIONS.AUDIT_LOGS).insertOne({
      user_id: Number(updatedBy),
      action: 'UPDATE',
      entity: 'borrower',
      entity_id: String(id),
      old_data: existing,
      new_data: data,
      created_at: new Date(),
    });

    const updated = await this.findById(id);
    if (!updated) throw new Error(`Borrower #${id} not found after update`);
    return updated;
  }

  async softDelete(id: number, deletedBy: number): Promise<void> {
    const db = await getMongoDb();
    const existing = await this.findById(id);
    if (!existing) throw new Error(`Borrower #${id} not found`);

    const activeLoansCount = await db.collection(MONGO_COLLECTIONS.LOANS).countDocuments({
      borrower_id: Number(id),
      status: { $in: ['active', 'overdue'] },
      deleted_at: null,
    });

    if (activeLoansCount > 0) {
      throw new Error(
        `Cannot delete borrower "${existing.fullName}" (${existing.borrowerId}) because they have ${activeLoansCount} active or overdue loan(s).`
      );
    }

    const now = new Date();
    await db
      .collection(MONGO_COLLECTIONS.BORROWERS)
      .updateOne({ id: Number(id), deleted_at: null }, { $set: { deleted_at: now } });

    await db.collection(MONGO_COLLECTIONS.AUDIT_LOGS).insertOne({
      user_id: Number(deletedBy),
      action: 'DELETE',
      entity: 'borrower',
      entity_id: String(id),
      old_data: existing,
      new_data: null,
      created_at: now,
    });
  }

  async getStats(borrowerId: number): Promise<BorrowerStats> {
    const db = await getMongoDb();
    const loans = await db
      .collection(MONGO_COLLECTIONS.LOANS)
      .find({ borrower_id: Number(borrowerId), deleted_at: null })
      .toArray();

    const totalLoans = loans.length;
    let activeLoans = 0;
    let completedLoans = 0;
    let borrowed = new Decimal(0);
    const loanIds: number[] = [];

    for (const l of loans) {
      loanIds.push(Number(l.id));
      if (l.status === 'active' || l.status === 'overdue') activeLoans++;
      if (l.status === 'completed') completedLoans++;
      borrowed = borrowed.plus(Number(l.principal_amount || 0));
    }

    let principalRepaid = new Decimal(0);
    let interestPaid = new Decimal(0);

    if (loanIds.length > 0) {
      const payments = await db
        .collection(MONGO_COLLECTIONS.PAYMENTS)
        .find({ loan_id: { $in: loanIds }, is_void: false })
        .toArray();

      for (const p of payments) {
        principalRepaid = principalRepaid.plus(Number(p.principal_portion || 0));
        interestPaid = interestPaid.plus(Number(p.interest_portion || 0));
      }
    }

    const outstanding = Decimal.max(0, borrowed.minus(principalRepaid));

    return {
      totalLoans,
      activeLoans,
      completedLoans,
      totalPrincipalBorrowed: borrowed.toNumber(),
      totalPrincipalRepaid: principalRepaid.toNumber(),
      totalInterestPaid: interestPaid.toNumber(),
      totalOutstanding: outstanding.toNumber(),
    };
  }

  async getLoanHistory(borrowerId: number): Promise<BorrowerLoanSummary[]> {
    const db = await getMongoDb();
    const loans = await db
      .collection(MONGO_COLLECTIONS.LOANS)
      .find({ borrower_id: Number(borrowerId), deleted_at: null })
      .sort({ loan_given_date: -1, id: -1 })
      .toArray();

    const results: BorrowerLoanSummary[] = [];

    for (const l of loans) {
      const payments = await db
        .collection(MONGO_COLLECTIONS.PAYMENTS)
        .find({ loan_id: Number(l.id), is_void: false })
        .toArray();

      let paid = new Decimal(0);
      for (const p of payments) {
        paid = paid.plus(Number(p.payment_amount || 0));
      }

      const principal = new Decimal(l.principal_amount || 0);
      const expected = new Decimal(l.total_expected_repayment || principal);
      const outstanding = Decimal.max(0, expected.minus(paid));

      results.push({
        id: Number(l.id),
        loanId: String(l.loan_id),
        principalAmount: principal.toNumber(),
        interestRate: Number(l.interest_rate || 0),
        interestRateType: l.interest_rate_type,
        tenure: Number(l.tenure || 0),
        tenureUnit: l.tenure_unit,
        loanGivenDate: String(l.loan_given_date || '').split('T')[0],
        dueDate: String(l.due_date || '').split('T')[0],
        totalExpectedRepayment: expected.toNumber(),
        status: l.status,
        totalPaid: paid.toNumber(),
        outstandingBalance: outstanding.toNumber(),
        createdAt: l.created_at instanceof Date ? l.created_at.toISOString() : String(l.created_at || ''),
      });
    }

    return results;
  }
}

export const mongoBorrowerRepository = new MongoBorrowerRepository();
