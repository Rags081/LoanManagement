import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as mongoDbModule from '../../netlify/functions/_lib/db/mongodb';
import { mongoUserRepository } from '../../netlify/functions/_lib/repositories/mongo/user.repository.mongo';
import { mongoBorrowerRepository } from '../../netlify/functions/_lib/repositories/mongo/borrower.repository.mongo';
import { mongoLoanRepository } from '../../netlify/functions/_lib/repositories/mongo/loan.repository.mongo';
import { mongoPaymentRepository } from '../../netlify/functions/_lib/repositories/mongo/payment.repository.mongo';
import { mongoCapitalRepository } from '../../netlify/functions/_lib/repositories/mongo/capital.repository.mongo';
import { mongoSettingsRepository } from '../../netlify/functions/_lib/repositories/mongo/settings.repository.mongo';
import { mongoDashboardRepository } from '../../netlify/functions/_lib/repositories/mongo/dashboard.repository.mongo';

interface MockDoc {
  id?: number;
  [key: string]: unknown;
}

describe('MongoDB Repositories Unit Tests', () => {
  let inMemoryStore: Record<string, MockDoc[]> = {};

  const createMockCollection = (name: string) => ({
    find: (filter: Record<string, unknown> = {}) => {
      let items = [...(inMemoryStore[name] || [])];
      if (filter.deleted_at === null) {
        items = items.filter((i) => i.deleted_at === null || i.deleted_at === undefined);
      }
      if (filter.id !== undefined) {
        if (typeof filter.id === 'object' && filter.id !== null && '$ne' in filter.id) {
          const neVal = (filter.id as { $ne: number }).$ne;
          items = items.filter((i) => i.id !== neVal);
        } else if (typeof filter.id === 'object' && filter.id !== null && '$in' in filter.id) {
          const inArr = (filter.id as { $in: number[] }).$in;
          items = items.filter((i) => i.id !== undefined && inArr.includes(i.id));
        } else if (typeof filter.id === 'number') {
          items = items.filter((i) => i.id === filter.id);
        }
      }
      if (filter.email) {
        items = items.filter((i) => i.email === filter.email);
      }
      if (filter.phone) {
        items = items.filter((i) => i.phone === filter.phone);
      }
      if (filter.borrower_id) {
        items = items.filter((i) => i.borrower_id === filter.borrower_id);
      }
      if (filter.loan_id) {
        if (typeof filter.loan_id === 'object' && filter.loan_id !== null && '$in' in filter.loan_id) {
          const inArr = (filter.loan_id as { $in: number[] }).$in;
          items = items.filter((i) => typeof i.loan_id === 'number' && inArr.includes(i.loan_id));
        } else {
          items = items.filter((i) => i.loan_id === filter.loan_id);
        }
      }
      if (filter.payment_id) {
        items = items.filter((i) => i.payment_id === filter.payment_id);
      }
      if (filter.is_void !== undefined) {
        items = items.filter((i) => Boolean(i.is_void) === Boolean(filter.is_void));
      }
      if (filter.setting_key) {
        items = items.filter((i) => i.setting_key === filter.setting_key);
      }

      return {
        sort: (_sortObj: unknown) => ({
          skip: (skipCount: number) => ({
            limit: (limitCount: number) => ({
              toArray: async () => items.slice(skipCount, skipCount + limitCount),
            }),
            toArray: async () => items.slice(skipCount),
          }),
          limit: (limitCount: number) => ({
            toArray: async () => items.slice(0, limitCount),
          }),
          toArray: async () => items,
        }),
        project: (_proj: unknown) => ({
          toArray: async () => items,
        }),
        limit: (limitCount: number) => ({
          toArray: async () => items.slice(0, limitCount),
        }),
        toArray: async () => items,
      };
    },
    findOne: async (filter: Record<string, unknown>) => {
      const items = inMemoryStore[name] || [];
      return items.find((i) => {
        if (filter.deleted_at === null && i.deleted_at !== null && i.deleted_at !== undefined) return false;
        if (filter.id !== undefined && i.id !== filter.id) return false;
        if (filter.email !== undefined && i.email !== filter.email) return false;
        if (filter.phone !== undefined && i.phone !== filter.phone) return false;
        if (filter.borrower_id !== undefined && i.borrower_id !== filter.borrower_id) return false;
        if (filter.loan_id !== undefined && i.loan_id !== filter.loan_id) return false;
        if (filter.payment_id !== undefined && i.payment_id !== filter.payment_id) return false;
        if (filter.setting_key !== undefined && i.setting_key !== filter.setting_key) return false;
        return true;
      }) || null;
    },
    countDocuments: async (filter: Record<string, unknown> = {}) => {
      let items = inMemoryStore[name] || [];
      if (filter.deleted_at === null) {
        items = items.filter((i) => i.deleted_at === null || i.deleted_at === undefined);
      }
      if (filter.is_void !== undefined) {
        items = items.filter((i) => Boolean(i.is_void) === Boolean(filter.is_void));
      }
      return items.length;
    },
    insertOne: async (doc: MockDoc) => {
      if (!inMemoryStore[name]) inMemoryStore[name] = [];
      inMemoryStore[name].push({ ...doc });
      return { insertedId: doc.id };
    },
    insertMany: async (docs: MockDoc[]) => {
      if (!inMemoryStore[name]) inMemoryStore[name] = [];
      inMemoryStore[name].push(...docs.map((d) => ({ ...d })));
      return { insertedCount: docs.length };
    },
    updateOne: async (filter: Record<string, unknown>, update: { $set?: Record<string, unknown> }) => {
      const items = inMemoryStore[name] || [];
      const item = items.find((i) => {
        if (filter.id !== undefined && i.id !== filter.id) return false;
        if (filter.setting_key !== undefined && i.setting_key !== filter.setting_key) return false;
        return true;
      });
      if (item && update.$set) {
        Object.assign(item, update.$set);
      }
      return { modifiedCount: item ? 1 : 0 };
    },
    deleteMany: async () => {
      inMemoryStore[name] = [];
      return { deletedCount: 0 };
    },
    createIndex: async () => 'idx_ok',
  });

  const mockDb = {
    collection: (name: string) => createMockCollection(name),
    command: async () => ({ ok: 1 }),
    databaseName: 'test_loan_management',
  };

  beforeEach(() => {
    inMemoryStore = {
      users: [
        {
          id: 1,
          email: 'admin@loanmanagement.local',
          full_name: 'Admin User',
          role: 'admin',
          password_hash: 'hash123',
          is_active: true,
          deleted_at: null,
        },
      ],
      borrowers: [
        {
          id: 1,
          borrower_id: 'BOR-001',
          full_name: 'John Doe',
          phone: '9876543210',
          email: 'john@example.com',
          status: 'active',
          created_by: 1,
          deleted_at: null,
        },
      ],
      loans: [
        {
          id: 1,
          loan_id: 'LN-001',
          borrower_id: 1,
          principal_amount: 10000,
          interest_rate: 3,
          interest_rate_type: 'monthly',
          loan_given_date: '2026-01-01',
          due_date: '2026-07-01',
          status: 'active',
          created_by: 1,
          deleted_at: null,
        },
      ],
      payments: [
        {
          id: 1,
          payment_id: 'PAY-001',
          loan_id: 1,
          payment_date: '2026-02-01',
          payment_amount: 300,
          principal_portion: 0,
          interest_portion: 300,
          payment_mode: 'upi',
          is_void: false,
          created_by: 1,
        },
      ],
      payment_allocations: [],
      capital_transactions: [
        {
          id: 1,
          transaction_id: 'CAP-001',
          transaction_date: '2026-01-01',
          transaction_type: 'capital_given',
          amount: 50000,
          running_balance: 50000,
          created_by: 1,
          deleted_at: null,
        },
      ],
      settings: [],
      audit_logs: [],
    };

    vi.spyOn(mongoDbModule, 'getMongoDb').mockResolvedValue(mockDb as unknown as mongoDbModule.Db);
  });

  it('MongoUserRepository: findByEmail and findById', async () => {
    const user = await mongoUserRepository.findByEmail('admin@loanmanagement.local');
    expect(user).not.toBeNull();
    expect(user?.full_name).toBe('Admin User');

    const byId = await mongoUserRepository.findById(1);
    expect(byId).not.toBeNull();
    expect(byId?.email).toBe('admin@loanmanagement.local');
  });

  it('MongoBorrowerRepository: findById and getStats', async () => {
    const b = await mongoBorrowerRepository.findById(1);
    expect(b).not.toBeNull();
    expect(b?.fullName).toBe('John Doe');
    expect(b?.borrowerId).toBe('BOR-001');

    const stats = await mongoBorrowerRepository.getStats(1);
    expect(stats.totalLoans).toBe(1);
    expect(stats.totalPrincipalBorrowed).toBe(10000);
    expect(stats.totalInterestPaid).toBe(300);
  });

  it('MongoLoanRepository: calculateOutstanding should produce correct ledger breakdown', async () => {
    const out = await mongoLoanRepository.calculateOutstanding(1);
    expect(out.principalAmount).toBe(10000);
    expect(out.principalReceived).toBe(0);
    expect(out.interestReceived).toBe(300);
    expect(out.principalOutstanding).toBe(10000);
  });

  it('MongoLoanRepository: getLoanSummary returns properly formatted and named fields', async () => {
    const summary = await mongoLoanRepository.getLoanSummary();
    expect(summary.totalLoans).toBe(1);
    expect(summary.activeLoans).toBe(1);
    expect(summary.totalPrincipalLent).toBe(10000);
    expect(summary.totalPrincipalRecovered).toBe(0);
    expect(summary.totalInterestRecovered).toBe(300);
    expect(summary.totalOutstanding).toBe(10000);
    expect(isNaN(summary.totalPrincipalRecovered + summary.totalInterestRecovered)).toBe(false);
  });

  it('MongoLoanRepository: getLoanPayments returns payments for loan', async () => {
    const payments = await mongoLoanRepository.getLoanPayments(1);
    expect(payments.length).toBe(1);
    expect(payments[0].receipt_number).toBe('PAY-001');
    expect(payments[0].payment_amount).toBe(300);
  });

  it('MongoLoanRepository: updateStatus updates loan status and settlement date', async () => {
    const updated = await mongoLoanRepository.updateStatus(1, 'completed', 1);
    expect(updated.status).toBe('completed');
    expect(updated.settlementDate).toBeTruthy();

    const activeAgain = await mongoLoanRepository.updateStatus(1, 'active', 1);
    expect(activeAgain.status).toBe('active');
  });

  it('MongoPaymentRepository: findByLoan and getTotalReceivedByLoan', async () => {
    const payments = await mongoPaymentRepository.findByLoan(1);
    expect(payments.length).toBe(1);
    expect(payments[0].payment_id).toBe('PAY-001');

    const total = await mongoPaymentRepository.getTotalReceivedByLoan(1);
    expect(total.total).toBe(300);
    expect(total.interestTotal).toBe(300);
  });

  it('MongoCapitalRepository: getBalance and getCurrentRunningBalance', async () => {
    const balance = await mongoCapitalRepository.getBalance();
    expect(balance.totalGiven).toBe(50000);
    expect(balance.currentBalance).toBe(50000);
  });

  it('MongoSettingsRepository: set and get settings', async () => {
    await mongoSettingsRepository.set('app_name', 'Test App');
    const val = await mongoSettingsRepository.get('app_name');
    expect(val).toBe('Test App');
  });

  it('MongoLoanRepository: findAll returns batch-enriched loans', async () => {
    const res = await mongoLoanRepository.findAll({}, { page: 1, limit: 10 });
    expect(res.total).toBe(1);
    expect(res.data.length).toBe(1);
    expect(res.data[0].borrowerName).toBe('John Doe');
    expect(res.data[0].principalAmount).toBe(10000);
    expect(res.data[0].interestReceived).toBe(300);
  });

  it('MongoDashboardRepository: getAllMetrics computes metrics in single pass', async () => {
    const metrics = await mongoDashboardRepository.getAllMetrics();
    expect(metrics.capital.totalGiven).toBe(50000);
    expect(metrics.loans.totalLoans).toBe(1);
    expect(metrics.loans.activeLoans).toBe(1);
    expect(metrics.collections.totalInterestReceived).toBe(300);
    expect(metrics.registeredBorrowersCount).toBe(1);
  });
});
