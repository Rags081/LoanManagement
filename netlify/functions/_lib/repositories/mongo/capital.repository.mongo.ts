import { Document } from 'mongodb';
import { getMongoDb, MONGO_COLLECTIONS } from '../../db/mongodb';
import { generateId, generateNumericId } from '../../id-generator';
import { toLocalDateString } from '../../financial-engine';
import Decimal from 'decimal.js';
import {
  DbCapitalTransaction,
  MappedCapitalTransaction,
  CapitalCreateDto,
  CapitalUpdateDto,
  CapitalFilterOptions,
  CapitalBalance,
  CapitalSummaryMonth,
} from '../capital.repository';

export class MongoCapitalRepository {
  private async enrichTransaction(doc: Document): Promise<MappedCapitalTransaction> {
    const db = await getMongoDb();
    let creatorName: string | undefined;

    if (doc.created_by) {
      const creator = await db
        .collection(MONGO_COLLECTIONS.USERS)
        .findOne({ id: Number(doc.created_by) });
      if (creator) creatorName = String(creator.full_name || '');
    }

    const txDate = toLocalDateString(doc.transaction_date as string | Date);
    const createdAt = doc.created_at instanceof Date ? doc.created_at.toISOString() : String(doc.created_at || '');
    const updatedAt = doc.updated_at instanceof Date ? doc.updated_at.toISOString() : String(doc.updated_at || '');
    const deletedAt = doc.deleted_at
      ? doc.deleted_at instanceof Date
        ? doc.deleted_at.toISOString()
        : String(doc.deleted_at)
      : null;

    return {
      id: Number(doc.id),
      transactionId: String(doc.transaction_id),
      transaction_id: String(doc.transaction_id),
      transactionDate: txDate,
      transaction_date: txDate,
      transactionType: doc.transaction_type,
      transaction_type: doc.transaction_type,
      amount: Number(doc.amount || 0),
      source: doc.source ? String(doc.source) : null,
      destination: doc.destination ? String(doc.destination) : null,
      description: doc.description ? String(doc.description) : null,
      referenceNumber: doc.reference_number ? String(doc.reference_number) : null,
      reference_number: doc.reference_number ? String(doc.reference_number) : null,
      notes: doc.notes ? String(doc.notes) : null,
      runningBalance: Number(doc.running_balance || 0),
      running_balance: Number(doc.running_balance || 0),
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

  async findById(id: number): Promise<MappedCapitalTransaction | null> {
    const db = await getMongoDb();
    const doc = await db
      .collection(MONGO_COLLECTIONS.CAPITAL_TRANSACTIONS)
      .findOne({ id: Number(id), deleted_at: null });
    return doc ? this.enrichTransaction(doc) : null;
  }

  async findByTransactionId(transactionId: string): Promise<MappedCapitalTransaction | null> {
    const db = await getMongoDb();
    const doc = await db
      .collection(MONGO_COLLECTIONS.CAPITAL_TRANSACTIONS)
      .findOne({ transaction_id: transactionId.trim(), deleted_at: null });
    return doc ? this.enrichTransaction(doc) : null;
  }

  async findAll(
    filters: CapitalFilterOptions = {}
  ): Promise<{ data: MappedCapitalTransaction[]; total: number; page: number; limit: number; totalPages: number }> {
    const db = await getMongoDb();
    const query: Record<string, unknown> = { deleted_at: null };

    if (filters.transactionType && filters.transactionType !== 'all') {
      query.transaction_type = filters.transactionType;
    }
    if (filters.startDate || filters.endDate) {
      const dateQuery: Record<string, string> = {};
      if (filters.startDate) dateQuery.$gte = filters.startDate;
      if (filters.endDate) dateQuery.$lte = filters.endDate;
      query.transaction_date = dateQuery;
    }
    if (filters.search) {
      const pattern = new RegExp(filters.search.trim(), 'i');
      query.$or = [
        { transaction_id: pattern },
        { description: pattern },
        { reference_number: pattern },
        { source: pattern },
        { destination: pattern },
      ];
    }

    const total = await db.collection(MONGO_COLLECTIONS.CAPITAL_TRANSACTIONS).countDocuments(query);
    const page = Math.max(1, filters.page || 1);
    const limit = Math.max(1, filters.limit || 10);
    const skip = (page - 1) * limit;
    const totalPages = Math.ceil(total / limit) || 1;

    const docs = await db
      .collection(MONGO_COLLECTIONS.CAPITAL_TRANSACTIONS)
      .find(query)
      .sort({ transaction_date: -1, id: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const data = await Promise.all(docs.map((doc) => this.enrichTransaction(doc)));
    return { data, total, page, limit, totalPages };
  }

  async getCurrentRunningBalance(): Promise<number> {
    const db = await getMongoDb();
    const docs = await db
      .collection(MONGO_COLLECTIONS.CAPITAL_TRANSACTIONS)
      .find({ deleted_at: null })
      .sort({ transaction_date: -1, id: -1 })
      .limit(1)
      .toArray();

    return docs[0]?.running_balance ? Number(docs[0].running_balance) : 0;
  }

  async recalculateRunningBalances(): Promise<void> {
    const db = await getMongoDb();
    const rows = await db
      .collection(MONGO_COLLECTIONS.CAPITAL_TRANSACTIONS)
      .find({ deleted_at: null })
      .sort({ transaction_date: 1, id: 1 })
      .toArray();

    let currentBalance = new Decimal(0);
    for (const row of rows) {
      const amount = new Decimal(row.amount || 0);
      if (row.transaction_type === 'capital_given') {
        currentBalance = currentBalance.plus(amount);
      } else if (row.transaction_type === 'capital_returned') {
        currentBalance = currentBalance.minus(amount);
      } else {
        currentBalance = currentBalance.plus(amount);
      }

      if (currentBalance.lessThan(0)) {
        throw new Error(
          `Recalculation error: Capital running balance cannot drop below 0 (occurred at transaction #${row.id})`
        );
      }

      await db
        .collection(MONGO_COLLECTIONS.CAPITAL_TRANSACTIONS)
        .updateOne({ id: row.id }, { $set: { running_balance: currentBalance.toNumber() } });
    }
  }

  async create(data: CapitalCreateDto, createdBy: number): Promise<DbCapitalTransaction> {
    const db = await getMongoDb();
    const transactionId =
      data.transactionId ||
      data.transaction_id ||
      (await generateId('CAP', MONGO_COLLECTIONS.CAPITAL_TRANSACTIONS, 'transaction_id'));

    const txDate = toLocalDateString(data.transactionDate || data.transaction_date);
    if (!txDate) {
      throw new Error('Transaction date is required');
    }

    const txType = data.transactionType || data.transaction_type || 'capital_given';
    const txAmount = new Decimal(data.amount);
    if (txAmount.lessThanOrEqualTo(0)) {
      throw new Error('Transaction amount must be greater than 0');
    }

    const nextId = await generateNumericId(MONGO_COLLECTIONS.CAPITAL_TRANSACTIONS);
    const now = new Date();

    const record = {
      id: nextId,
      transaction_id: transactionId,
      transaction_date: txDate,
      transaction_type: txType,
      amount: txAmount.toNumber(),
      source: data.source ? String(data.source).trim() : null,
      destination: data.destination ? String(data.destination).trim() : null,
      description: data.description ? String(data.description).trim() : null,
      reference_number: data.referenceNumber || data.reference_number ? String(data.referenceNumber || data.reference_number).trim() : null,
      notes: data.notes ? String(data.notes).trim() : null,
      running_balance: 0,
      created_by: Number(createdBy),
      created_at: now,
      updated_at: now,
      deleted_at: null,
    };

    await db.collection(MONGO_COLLECTIONS.CAPITAL_TRANSACTIONS).insertOne(record);

    await this.recalculateRunningBalances();

    await db.collection(MONGO_COLLECTIONS.AUDIT_LOGS).insertOne({
      user_id: Number(createdBy),
      action: 'CREATE',
      entity: 'capital_transaction',
      entity_id: String(nextId),
      old_data: null,
      new_data: { ...data, transaction_id: transactionId },
      created_at: now,
    });

    const created = await this.findById(nextId);
    if (!created) throw new Error('Failed to retrieve newly created capital transaction');
    return created as unknown as DbCapitalTransaction;
  }

  async update(id: number, data: CapitalUpdateDto, updatedBy: number): Promise<DbCapitalTransaction> {
    const db = await getMongoDb();
    const existing = await this.findById(id);
    if (!existing) throw new Error(`Capital transaction #${id} not found`);

    const setFields: Record<string, unknown> = { updated_at: new Date() };

    const txDate = data.transactionDate !== undefined ? data.transactionDate : data.transaction_date;
    if (txDate !== undefined) setFields.transaction_date = toLocalDateString(txDate);

    const txType = data.transactionType !== undefined ? data.transactionType : data.transaction_type;
    if (txType !== undefined) setFields.transaction_type = txType;

    if (data.amount !== undefined) {
      const amt = new Decimal(data.amount);
      if (amt.lessThanOrEqualTo(0)) throw new Error('Amount must be greater than 0');
      setFields.amount = amt.toNumber();
    }

    if (data.source !== undefined) setFields.source = data.source ? String(data.source).trim() : null;
    if (data.destination !== undefined) setFields.destination = data.destination ? String(data.destination).trim() : null;
    if (data.description !== undefined) setFields.description = data.description ? String(data.description).trim() : null;

    const refNum = data.referenceNumber !== undefined ? data.referenceNumber : data.reference_number;
    if (refNum !== undefined) setFields.reference_number = refNum ? String(refNum).trim() : null;

    if (data.notes !== undefined) setFields.notes = data.notes ? String(data.notes).trim() : null;

    await db
      .collection(MONGO_COLLECTIONS.CAPITAL_TRANSACTIONS)
      .updateOne({ id: Number(id), deleted_at: null }, { $set: setFields });

    await this.recalculateRunningBalances();

    await db.collection(MONGO_COLLECTIONS.AUDIT_LOGS).insertOne({
      user_id: Number(updatedBy),
      action: 'UPDATE',
      entity: 'capital_transaction',
      entity_id: String(id),
      old_data: existing,
      new_data: data,
      created_at: new Date(),
    });

    const updated = await this.findById(id);
    if (!updated) throw new Error(`Capital transaction #${id} not found after update`);
    return updated as unknown as DbCapitalTransaction;
  }

  async softDelete(id: number, deletedBy: number): Promise<void> {
    const db = await getMongoDb();
    const existing = await this.findById(id);
    if (!existing) throw new Error(`Capital transaction #${id} not found`);

    const now = new Date();
    await db
      .collection(MONGO_COLLECTIONS.CAPITAL_TRANSACTIONS)
      .updateOne({ id: Number(id), deleted_at: null }, { $set: { deleted_at: now } });

    await this.recalculateRunningBalances();

    await db.collection(MONGO_COLLECTIONS.AUDIT_LOGS).insertOne({
      user_id: Number(deletedBy),
      action: 'DELETE',
      entity: 'capital_transaction',
      entity_id: String(id),
      old_data: existing,
      new_data: null,
      created_at: now,
    });
  }

  async getBalance(): Promise<CapitalBalance> {
    const db = await getMongoDb();
    const docs = await db
      .collection(MONGO_COLLECTIONS.CAPITAL_TRANSACTIONS)
      .find({ deleted_at: null })
      .toArray();

    let given = new Decimal(0);
    let returned = new Decimal(0);

    for (const d of docs) {
      const amt = Number(d.amount || 0);
      if (d.transaction_type === 'capital_given') given = given.plus(amt);
      if (d.transaction_type === 'capital_returned') returned = returned.plus(amt);
    }

    const currentBalance = await this.getCurrentRunningBalance();

    return {
      totalGiven: given.toNumber(),
      totalReturned: returned.toNumber(),
      currentBalance,
      transactionCount: docs.length,
      lastUpdated: new Date().toISOString(),
    };
  }

  async getSummary(year?: number): Promise<CapitalSummaryMonth[]> {
    const db = await getMongoDb();
    const targetYear = year || new Date().getFullYear();
    const yearStr = String(targetYear);

    const docs = await db
      .collection(MONGO_COLLECTIONS.CAPITAL_TRANSACTIONS)
      .find({
        deleted_at: null,
        transaction_date: { $regex: `^${yearStr}-` },
      })
      .sort({ transaction_date: 1 })
      .toArray();

    const monthlyMap: Record<string, { given: Decimal; returned: Decimal }> = {};

    for (const d of docs) {
      const txDate = toLocalDateString(d.transaction_date as string | Date);
      const period = txDate.substring(0, 7);
      if (!monthlyMap[period]) {
        monthlyMap[period] = { given: new Decimal(0), returned: new Decimal(0) };
      }
      const amt = Number(d.amount || 0);
      if (d.transaction_type === 'capital_given') {
        monthlyMap[period].given = monthlyMap[period].given.plus(amt);
      } else if (d.transaction_type === 'capital_returned') {
        monthlyMap[period].returned = monthlyMap[period].returned.plus(amt);
      }
    }

    const periods = Object.keys(monthlyMap).sort();
    return periods.map((period) => {
      const g = monthlyMap[period].given;
      const r = monthlyMap[period].returned;
      return {
        period,
        given: g.toNumber(),
        returned: r.toNumber(),
        netFlow: g.minus(r).toNumber(),
      };
    });
  }
}

export const mongoCapitalRepository = new MongoCapitalRepository();
