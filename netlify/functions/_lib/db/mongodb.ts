import { MongoClient, Db, ClientSession } from 'mongodb';
import { getDatabaseConfig } from './config';
import dns from 'dns';

// Safe DNS fallback for environments with local resolver limitations
try {
  const currentServers = dns.getServers();
  if (!currentServers || currentServers.length === 0 || currentServers[0] === '0.0.0.0') {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  }
} catch {
  // Ignore if custom DNS cannot be configured
}

let client: MongoClient | null = null;
let db: Db | null = null;
let indexesEnsured = false;

export const MONGO_COLLECTIONS = {
  USERS: 'users',
  BORROWERS: 'borrowers',
  LOANS: 'loans',
  PAYMENTS: 'payments',
  PAYMENT_ALLOCATIONS: 'payment_allocations',
  CAPITAL_TRANSACTIONS: 'capital_transactions',
  SETTINGS: 'settings',
  AUDIT_LOGS: 'audit_logs',
} as const;

export const getMongoClient = async (): Promise<MongoClient> => {
  if (client) {
    return client;
  }

  const config = getDatabaseConfig().mongodb;
  const newClient = new MongoClient(config.uri, {
    maxPoolSize: config.maxPoolSize,
    minPoolSize: config.minPoolSize,
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 15000,
  });

  try {
    await newClient.connect();
    client = newClient;

    client.on('close', () => {
      client = null;
      db = null;
      indexesEnsured = false;
    });

    return client;
  } catch (err) {
    try {
      await newClient.close();
    } catch {
      // Ignore cleanup error
    }
    client = null;
    db = null;
    indexesEnsured = false;
    throw err;
  }
};

export const getMongoDb = async (): Promise<Db> => {
  const activeClient = await getMongoClient();
  const config = getDatabaseConfig().mongodb;

  if (!db || db.databaseName !== config.database) {
    db = activeClient.db(config.database);
  }

  if (!indexesEnsured) {
    await ensureMongoIndexes(db).catch((err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn('Warning: Could not auto-ensure MongoDB indexes:', msg);
    });
    indexesEnsured = true;
  }

  return db;
};

export const closeMongoDb = async (): Promise<void> => {
  if (client) {
    try {
      await client.close();
    } catch {
      // Ignore close error
    }
    client = null;
    db = null;
    indexesEnsured = false;
  }
};

/**
 * Executes a callback with a managed MongoDB transaction/session
 */
export const withMongoSession = async <T>(
  callback: (session: ClientSession, db: Db) => Promise<T>
): Promise<T> => {
  const activeClient = await getMongoClient();
  const activeDb = await getMongoDb();
  const session = activeClient.startSession();
  try {
    let result: T;
    try {
      session.startTransaction();
      result = await callback(session, activeDb);
      await session.commitTransaction();
    } catch (txError: unknown) {
      const msg = txError instanceof Error ? txError.message : '';
      if (
        msg.includes('Transactions are not supported') ||
        msg.includes('Transaction numbers are only allowed on a replica set')
      ) {
        result = await callback(session, activeDb);
      } else {
        await session.abortTransaction();
        throw txError;
      }
    }
    return result;
  } finally {
    await session.endSession();
  }
};

/**
 * Creates recommended indexes across all collections
 */
export async function ensureMongoIndexes(targetDb: Db): Promise<void> {
  const users = targetDb.collection(MONGO_COLLECTIONS.USERS);
  await users.createIndex({ id: 1 }, { unique: true });
  await users.createIndex({ email: 1 }, { unique: true });
  await users.createIndex({ role: 1 });
  await users.createIndex({ deleted_at: 1 });

  const borrowers = targetDb.collection(MONGO_COLLECTIONS.BORROWERS);
  await borrowers.createIndex({ id: 1 }, { unique: true });
  await borrowers.createIndex({ borrower_id: 1 }, { unique: true });
  await borrowers.createIndex({ phone: 1 });
  await borrowers.createIndex({ status: 1 });
  await borrowers.createIndex({ deleted_at: 1 });

  const loans = targetDb.collection(MONGO_COLLECTIONS.LOANS);
  await loans.createIndex({ id: 1 }, { unique: true });
  await loans.createIndex({ loan_id: 1 }, { unique: true });
  await loans.createIndex({ borrower_id: 1 });
  await loans.createIndex({ status: 1 });
  await loans.createIndex({ due_date: 1 });
  await loans.createIndex({ loan_given_date: 1 });
  await loans.createIndex({ deleted_at: 1 });

  const payments = targetDb.collection(MONGO_COLLECTIONS.PAYMENTS);
  await payments.createIndex({ id: 1 }, { unique: true });
  await payments.createIndex({ payment_id: 1 }, { unique: true });
  await payments.createIndex({ loan_id: 1 });
  await payments.createIndex({ payment_date: 1 });
  await payments.createIndex({ is_void: 1 });

  const allocations = targetDb.collection(MONGO_COLLECTIONS.PAYMENT_ALLOCATIONS);
  await allocations.createIndex({ id: 1 }, { unique: true });
  await allocations.createIndex({ payment_id: 1 });
  await allocations.createIndex({ allocated_to: 1 });

  const capital = targetDb.collection(MONGO_COLLECTIONS.CAPITAL_TRANSACTIONS);
  await capital.createIndex({ id: 1 }, { unique: true });
  await capital.createIndex({ transaction_id: 1 }, { unique: true });
  await capital.createIndex({ transaction_date: 1 });
  await capital.createIndex({ transaction_type: 1 });
  await capital.createIndex({ deleted_at: 1 });

  const settings = targetDb.collection(MONGO_COLLECTIONS.SETTINGS);
  await settings.createIndex({ setting_key: 1 }, { unique: true });

  const audit = targetDb.collection(MONGO_COLLECTIONS.AUDIT_LOGS);
  await audit.createIndex({ user_id: 1 });
  await audit.createIndex({ action: 1 });
  await audit.createIndex({ entity: 1 });
  await audit.createIndex({ entity_id: 1 });
  await audit.createIndex({ created_at: -1 });
}

export default {
  MONGO_COLLECTIONS,
  getMongoClient,
  getMongoDb,
  closeMongoDb,
  withMongoSession,
  ensureMongoIndexes,
};
