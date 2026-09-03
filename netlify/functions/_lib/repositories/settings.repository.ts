import { RowDataPacket, ResultSetHeader, PoolConnection } from 'mysql2/promise';
import { getPool } from '../database';

export interface DbSetting extends RowDataPacket {
  id: number;
  setting_key: string;
  setting_value: string;
  setting_type: 'string' | 'number' | 'boolean' | 'json';
  description: string | null;
  updated_by: number | null;
  updated_at: Date | string;
}

export interface TableCountStat {
  table: string;
  count: number;
}

export interface SystemInfoData {
  status: 'healthy' | 'degraded' | 'error';
  pingMs: number;
  database: string;
  serverTime: string;
  uptimeSeconds: number;
  nodeVersion: string;
  tableCounts: {
    borrowers: number;
    loans: number;
    payments: number;
    capitalTransactions: number;
    auditLogs: number;
    users: number;
    settings: number;
  };
}

export const DEFAULT_SETTINGS: Record<string, { value: unknown; type: 'string' | 'number' | 'boolean' | 'json'; description: string }> = {
  // General & Business
  app_name: { value: 'SmartLend Portfolio Manager', type: 'string', description: 'Application display name' },
  company_name: { value: 'SmartLend Financial Services', type: 'string', description: 'Registered business/company name' },
  company_phone: { value: '+91 9876543210', type: 'string', description: 'Business contact phone number' },
  company_email: { value: 'support@smartlend.local', type: 'string', description: 'Support/contact email address' },
  company_address: { value: 'Suite 400, Financial District, Mumbai', type: 'string', description: 'Physical office address' },
  tax_number: { value: 'GSTIN27AAAAA0000A1Z5', type: 'string', description: 'Business Tax / GST Number' },
  currency_symbol: { value: '₹', type: 'string', description: 'Currency symbol' },
  currency_format: { value: 'INR', type: 'string', description: 'Currency code' },
  date_format: { value: 'DD-MMM-YYYY', type: 'string', description: 'Date display format' },
  timezone: { value: 'Asia/Kolkata', type: 'string', description: 'Primary timezone' },

  // Loan & Repayment Defaults
  default_interest_rate: { value: 3.0, type: 'number', description: 'Default monthly interest rate percentage' },
  interest_calculation_type: { value: 'monthly', type: 'string', description: 'Default interest calculation method (monthly, daily_prorated, flat)' },
  payment_allocation_method: { value: 'principal_first', type: 'string', description: 'How payments are allocated: principal_first, interest_first, proportional' },
  enable_overdue_interest: { value: false, type: 'boolean', description: 'Whether to charge interest on overdue amount' },
  grace_period_days: { value: 0, type: 'number', description: 'Days before overdue is triggered' },
  default_tenure: { value: 12, type: 'number', description: 'Default loan tenure duration' },
  default_tenure_unit: { value: 'months', type: 'string', description: 'Default tenure unit: days, weeks, months, years' },

  // ID Numbering Prefixes
  borrower_id_prefix: { value: 'BOR', type: 'string', description: 'Prefix for borrower IDs' },
  loan_id_prefix: { value: 'LN', type: 'string', description: 'Prefix for loan IDs' },
  payment_id_prefix: { value: 'PAY', type: 'string', description: 'Prefix for payment IDs' },
  capital_id_prefix: { value: 'CAP', type: 'string', description: 'Prefix for capital transaction IDs' },

  // Alerts & Security
  overdue_alert_days: { value: 7, type: 'number', description: 'Threshold days to trigger overdue warning badges' },
  send_email_alerts: { value: false, type: 'boolean', description: 'Toggle automated email notifications' },
  auto_logout_minutes: { value: 60, type: 'number', description: 'Session inactivity timeout in minutes' },
  enable_audit_logging: { value: true, type: 'boolean', description: 'Record changes in system audit logs' },
};

export class SettingsRepository {
  async get(settingKey: string, connection?: PoolConnection): Promise<string | null> {
    const conn = connection || getPool();
    const [rows] = await conn.query<DbSetting[]>(
      'SELECT setting_value FROM settings WHERE setting_key = ? LIMIT 1',
      [settingKey.trim()]
    );
    return rows[0]?.setting_value ?? null;
  }

  async getBoolean(settingKey: string, defaultValue: boolean = false, connection?: PoolConnection): Promise<boolean> {
    const val = await this.get(settingKey, connection);
    if (val === null) return defaultValue;
    return val === 'true' || val === '1';
  }

  async getNumber(settingKey: string, defaultValue: number | null = null, connection?: PoolConnection): Promise<number | null> {
    const val = await this.get(settingKey, connection);
    if (val === null) return defaultValue;
    const num = Number(val);
    return isNaN(num) ? defaultValue : num;
  }

  async set(settingKey: string, value: unknown, updatedBy?: number, connection?: PoolConnection): Promise<void> {
    const conn = connection || getPool();

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

    await conn.execute<ResultSetHeader>(
      `INSERT INTO settings (setting_key, setting_value, setting_type, description, updated_by)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         setting_value = VALUES(setting_value),
         setting_type = VALUES(setting_type),
         description = IFNULL(VALUES(description), description),
         updated_by = VALUES(updated_by)`,
      [settingKey.trim(), stringValue, settingType, desc, updatedBy ?? null]
    );
  }

  async setMany(records: Record<string, unknown>, updatedBy?: number, connection?: PoolConnection): Promise<void> {
    const conn = connection || getPool();
    for (const [k, v] of Object.entries(records)) {
      if (v !== undefined) {
        await this.set(k, v, updatedBy ?? null, conn);
      }
    }
  }

  async getAll(connection?: PoolConnection): Promise<Record<string, unknown>> {
    const conn = connection || getPool();
    const [rows] = await conn.query<DbSetting[]>('SELECT * FROM settings');

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

  async resetToDefaults(updatedBy?: number, connection?: PoolConnection): Promise<Record<string, unknown>> {
    const conn = connection || getPool();
    for (const [k, v] of Object.entries(DEFAULT_SETTINGS)) {
      await this.set(k, v.value, updatedBy, conn);
    }
    return this.getAll(conn);
  }

  async getSystemInfo(connection?: PoolConnection): Promise<SystemInfoData> {
    const conn = connection || getPool();
    const start = Date.now();

    await conn.query('SELECT 1');
    const pingMs = Date.now() - start;

    const [bRows] = await conn.query<RowDataPacket[]>('SELECT COUNT(*) AS total FROM borrowers WHERE deleted_at IS NULL');
    const [lRows] = await conn.query<RowDataPacket[]>('SELECT COUNT(*) AS total FROM loans WHERE deleted_at IS NULL');
    const [pRows] = await conn.query<RowDataPacket[]>('SELECT COUNT(*) AS total FROM payments WHERE is_void = FALSE');
    const [cRows] = await conn.query<RowDataPacket[]>('SELECT COUNT(*) AS total FROM capital_transactions');
    const [aRows] = await conn.query<RowDataPacket[]>('SELECT COUNT(*) AS total FROM audit_logs');
    const [uRows] = await conn.query<RowDataPacket[]>('SELECT COUNT(*) AS total FROM users WHERE deleted_at IS NULL');
    const [sRows] = await conn.query<RowDataPacket[]>('SELECT COUNT(*) AS total FROM settings');

    return {
      status: 'healthy',
      pingMs,
      database: process.env.DB_NAME || 'app_db',
      serverTime: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      nodeVersion: process.version,
      tableCounts: {
        borrowers: Number(bRows[0]?.total || 0),
        loans: Number(lRows[0]?.total || 0),
        payments: Number(pRows[0]?.total || 0),
        capitalTransactions: Number(cRows[0]?.total || 0),
        auditLogs: Number(aRows[0]?.total || 0),
        users: Number(uRows[0]?.total || 0),
        settings: Number(sRows[0]?.total || 0),
      },
    };
  }

  async getFullDatabaseBackup(connection?: PoolConnection): Promise<Record<string, unknown>> {
    const conn = connection || getPool();

    const [borrowers] = await conn.query('SELECT * FROM borrowers WHERE deleted_at IS NULL');
    const [loans] = await conn.query('SELECT * FROM loans WHERE deleted_at IS NULL');
    const [payments] = await conn.query('SELECT * FROM payments WHERE is_void = FALSE');
    const [allocations] = await conn.query('SELECT * FROM payment_allocations');
    const [capital] = await conn.query('SELECT * FROM capital_transactions');
    const [settings] = await conn.query('SELECT setting_key, setting_value, setting_type, description FROM settings');
    const [users] = await conn.query('SELECT id, email, full_name, role, is_active, created_at FROM users WHERE deleted_at IS NULL');

    return {
      metadata: {
        system: 'Loan Management System',
        exportDate: new Date().toISOString(),
        version: '1.0.0',
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

export const settingsRepository = new SettingsRepository();
export default settingsRepository;
