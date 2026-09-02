import { getMongoDb, MONGO_COLLECTIONS } from '../../db/mongodb';
import { generateNumericId } from '../../id-generator';
import {
  DEFAULT_SETTINGS,
  SystemInfoData,
} from '../settings.repository';

export class MongoSettingsRepository {
  async get(settingKey: string): Promise<string | null> {
    const db = await getMongoDb();
    const doc = await db
      .collection(MONGO_COLLECTIONS.SETTINGS)
      .findOne({ setting_key: settingKey.trim() });
    return doc?.setting_value ?? null;
  }

  async getBoolean(settingKey: string, defaultValue: boolean = false): Promise<boolean> {
    const val = await this.get(settingKey);
    if (val === null) return defaultValue;
    return val === 'true' || val === '1';
  }

  async getNumber(settingKey: string, defaultValue: number | null = null): Promise<number | null> {
    const val = await this.get(settingKey);
    if (val === null) return defaultValue;
    const num = Number(val);
    return isNaN(num) ? defaultValue : num;
  }

  async set(settingKey: string, value: unknown, updatedBy?: number): Promise<void> {
    const db = await getMongoDb();

    let stringValue: string;
    let settingType: 'string' | 'number' | 'boolean' | 'json' = 'string';

    if (typeof value === 'boolean') {
      stringValue = value ? 'true' : 'false';
      settingType = 'boolean';
    } else if (typeof value === 'number') {
      stringValue = String(value);
      settingType = 'number';
    } else if (typeof value === 'object' && value !== null) {
      stringValue = JSON.stringify(value);
      settingType = 'json';
    } else {
      stringValue = String(value ?? '');
      settingType = 'string';
    }

    const desc = DEFAULT_SETTINGS[settingKey]?.description || null;
    const existing = await db
      .collection(MONGO_COLLECTIONS.SETTINGS)
      .findOne({ setting_key: settingKey.trim() });

    const now = new Date();

    if (existing) {
      await db.collection(MONGO_COLLECTIONS.SETTINGS).updateOne(
        { setting_key: settingKey.trim() },
        {
          $set: {
            setting_value: stringValue,
            setting_type: settingType,
            description: desc || existing.description,
            updated_by: updatedBy ?? null,
            updated_at: now,
          },
        }
      );
    } else {
      const nextId = await generateNumericId(MONGO_COLLECTIONS.SETTINGS);
      await db.collection(MONGO_COLLECTIONS.SETTINGS).insertOne({
        id: nextId,
        setting_key: settingKey.trim(),
        setting_value: stringValue,
        setting_type: settingType,
        description: desc,
        updated_by: updatedBy ?? null,
        updated_at: now,
      });
    }
  }

  async setMany(records: Record<string, unknown>, updatedBy?: number): Promise<void> {
    for (const [k, v] of Object.entries(records)) {
      if (v !== undefined) {
        await this.set(k, v, updatedBy ?? null);
      }
    }
  }

  async getAll(): Promise<Record<string, unknown>> {
    const db = await getMongoDb();
    const rows = await db.collection(MONGO_COLLECTIONS.SETTINGS).find().toArray();

    // Start with all defaults
    const result: Record<string, unknown> = {};
    for (const [k, def] of Object.entries(DEFAULT_SETTINGS)) {
      result[k] = def.value;
    }

    // Override with database values
    for (const row of rows) {
      if (row.setting_type === 'boolean') {
        result[row.setting_key] = row.setting_value === 'true' || row.setting_value === '1';
      } else if (row.setting_type === 'number') {
        result[row.setting_key] = Number(row.setting_value);
      } else if (row.setting_type === 'json') {
        try {
          result[row.setting_key] = JSON.parse(row.setting_value);
        } catch {
          result[row.setting_key] = row.setting_value;
        }
      } else {
        result[row.setting_key] = row.setting_value;
      }
    }

    return result;
  }

  async resetToDefaults(updatedBy?: number): Promise<Record<string, unknown>> {
    for (const [k, v] of Object.entries(DEFAULT_SETTINGS)) {
      await this.set(k, v.value, updatedBy);
    }
    return this.getAll();
  }

  async getSystemInfo(): Promise<SystemInfoData> {
    const db = await getMongoDb();
    const start = Date.now();

    await db.command({ ping: 1 });
    const pingMs = Date.now() - start;

    const [bCount, lCount, pCount, cCount, aCount, uCount, sCount] = await Promise.all([
      db.collection(MONGO_COLLECTIONS.BORROWERS).countDocuments({ deleted_at: null }),
      db.collection(MONGO_COLLECTIONS.LOANS).countDocuments({ deleted_at: null }),
      db.collection(MONGO_COLLECTIONS.PAYMENTS).countDocuments({ is_void: false }),
      db.collection(MONGO_COLLECTIONS.CAPITAL_TRANSACTIONS).countDocuments({ deleted_at: null }),
      db.collection(MONGO_COLLECTIONS.AUDIT_LOGS).countDocuments(),
      db.collection(MONGO_COLLECTIONS.USERS).countDocuments({ deleted_at: null }),
      db.collection(MONGO_COLLECTIONS.SETTINGS).countDocuments(),
    ]);

    return {
      status: 'healthy',
      pingMs,
      database: db.databaseName,
      serverTime: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      nodeVersion: process.version,
      tableCounts: {
        borrowers: bCount,
        loans: lCount,
        payments: pCount,
        capitalTransactions: cCount,
        auditLogs: aCount,
        users: uCount,
        settings: sCount,
      },
    };
  }

  async getFullDatabaseBackup(): Promise<Record<string, unknown>> {
    const db = await getMongoDb();

    const [borrowers, loans, payments, allocations, capital, settings, users] = await Promise.all([
      db.collection(MONGO_COLLECTIONS.BORROWERS).find({ deleted_at: null }).toArray(),
      db.collection(MONGO_COLLECTIONS.LOANS).find({ deleted_at: null }).toArray(),
      db.collection(MONGO_COLLECTIONS.PAYMENTS).find({ is_void: false }).toArray(),
      db.collection(MONGO_COLLECTIONS.PAYMENT_ALLOCATIONS).find().toArray(),
      db.collection(MONGO_COLLECTIONS.CAPITAL_TRANSACTIONS).find({ deleted_at: null }).toArray(),
      db.collection(MONGO_COLLECTIONS.SETTINGS).find().project({ setting_key: 1, setting_value: 1, setting_type: 1, description: 1 }).toArray(),
      db.collection(MONGO_COLLECTIONS.USERS).find({ deleted_at: null }).project({ id: 1, email: 1, full_name: 1, role: 1, is_active: 1, created_at: 1 }).toArray(),
    ]);

    return {
      metadata: {
        system: 'Loan Management System',
        exportDate: new Date().toISOString(),
        version: '1.0.0',
        driver: 'mongodb',
      },
      borrowers,
      loans,
      payments,
      paymentAllocations: allocations,
      capitalTransactions: capital,
      settings,
      users,
    };
  }
}

export const mongoSettingsRepository = new MongoSettingsRepository();
