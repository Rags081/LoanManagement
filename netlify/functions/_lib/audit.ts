import { getDbDriver } from './db/config';
import { getMongoDb, MONGO_COLLECTIONS } from './db/mongodb';
import { getPool } from './database';

export interface AuditLogEntry {
  userId?: number | null;
  action: string;
  entity: string;
  entityId?: string | number | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  oldData?: unknown;
  newData?: unknown;
}

export async function logAudit(entry: AuditLogEntry): Promise<void> {
  try {
    const driver = getDbDriver();
    if (driver === 'mongodb') {
      const db = await getMongoDb();
      await db.collection(MONGO_COLLECTIONS.AUDIT_LOGS).insertOne({
        user_id: entry.userId ? Number(entry.userId) : null,
        action: entry.action,
        entity: entry.entity,
        entity_id: entry.entityId ? String(entry.entityId) : null,
        ip_address: entry.ipAddress || null,
        user_agent: entry.userAgent || null,
        old_data: entry.oldData || null,
        new_data: entry.newData || null,
        created_at: new Date(),
      });
    } else {
      const pool = getPool();
      await pool.execute(
        `INSERT INTO audit_logs (user_id, action, entity, entity_id, ip_address, user_agent, old_data, new_data)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          entry.userId || null,
          entry.action,
          entry.entity,
          entry.entityId ? String(entry.entityId) : null,
          entry.ipAddress || null,
          entry.userAgent || null,
          entry.oldData ? JSON.stringify(entry.oldData) : null,
          entry.newData ? JSON.stringify(entry.newData) : null,
        ]
      );
    }
  } catch (err) {
    console.warn('Warning: Failed to write audit log:', err);
  }
}
