import { Document } from 'mongodb';
import { getMongoDb, MONGO_COLLECTIONS } from '../../db/mongodb';
import { generateNumericId } from '../../id-generator';
import {
  DbUser,
  UserCreateDto,
  UserUpdateDto,
  UserFilterOptions,
} from '../user.repository';

export class MongoUserRepository {
  private mapUser(doc: Document): DbUser {
    return {
      id: Number(doc.id),
      email: String(doc.email),
      password_hash: String(doc.password_hash),
      full_name: String(doc.full_name),
      role: doc.role,
      is_active: doc.is_active ? 1 : 0,
      created_at: doc.created_at,
      updated_at: doc.updated_at,
      deleted_at: doc.deleted_at || null,
    } as unknown as DbUser;
  }

  async findByEmail(email: string): Promise<DbUser | null> {
    const db = await getMongoDb();
    const doc = await db
      .collection(MONGO_COLLECTIONS.USERS)
      .findOne({ email: email.toLowerCase().trim(), deleted_at: null });
    return doc ? this.mapUser(doc) : null;
  }

  async findById(id: number): Promise<DbUser | null> {
    const db = await getMongoDb();
    const doc = await db
      .collection(MONGO_COLLECTIONS.USERS)
      .findOne({ id: Number(id), deleted_at: null });
    return doc ? this.mapUser(doc) : null;
  }

  async findAll(
    filters: UserFilterOptions = {}
  ): Promise<{ data: DbUser[]; total: number; page: number; limit: number; totalPages: number }> {
    const db = await getMongoDb();
    const query: Record<string, unknown> = { deleted_at: null };

    if (filters.role && filters.role !== 'all') {
      query.role = filters.role;
    }
    if (filters.is_active !== undefined) {
      query.is_active = Boolean(filters.is_active);
    }
    if (filters.search) {
      const pattern = new RegExp(filters.search.trim(), 'i');
      query.$or = [{ full_name: pattern }, { email: pattern }];
    }

    const total = await db.collection(MONGO_COLLECTIONS.USERS).countDocuments(query);

    const page = Math.max(1, filters.page || 1);
    const limit = Math.max(1, filters.limit || 10);
    const skip = (page - 1) * limit;
    const totalPages = Math.ceil(total / limit) || 1;

    const docs = await db
      .collection(MONGO_COLLECTIONS.USERS)
      .find(query)
      .sort({ id: 1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    return {
      data: docs.map((d) => this.mapUser(d)),
      total,
      page,
      limit,
      totalPages,
    };
  }

  async create(data: UserCreateDto): Promise<DbUser> {
    const db = await getMongoDb();
    const email = data.email.toLowerCase().trim();

    const existing = await this.findByEmail(email);
    if (existing) {
      throw new Error(`User with email "${email}" already exists`);
    }

    const nextId = await generateNumericId(MONGO_COLLECTIONS.USERS);
    const now = new Date();

    const record = {
      id: nextId,
      email,
      password_hash: data.password_hash,
      full_name: data.full_name.trim(),
      role: data.role || 'viewer',
      is_active: data.is_active !== undefined ? Boolean(data.is_active) : true,
      created_at: now,
      updated_at: now,
      deleted_at: null,
    };

    await db.collection(MONGO_COLLECTIONS.USERS).insertOne(record);

    await db.collection(MONGO_COLLECTIONS.AUDIT_LOGS).insertOne({
      user_id: nextId,
      action: 'CREATE',
      entity: 'user',
      entity_id: String(nextId),
      old_data: null,
      new_data: { email, full_name: data.full_name, role: data.role },
      created_at: now,
    });

    const created = await this.findById(nextId);
    if (!created) throw new Error('Failed to retrieve newly created user');
    return created;
  }

  async update(id: number, data: UserUpdateDto, updatedBy: number): Promise<DbUser> {
    const db = await getMongoDb();
    const existing = await this.findById(id);
    if (!existing) throw new Error(`User #${id} not found`);

    const setFields: Record<string, unknown> = { updated_at: new Date() };

    if (data.email) {
      const email = data.email.toLowerCase().trim();
      const duplicate = await db
        .collection(MONGO_COLLECTIONS.USERS)
        .findOne({ email, id: { $ne: Number(id) }, deleted_at: null });
      if (duplicate) {
        throw new Error(`Email "${email}" is already in use by another user`);
      }
      setFields.email = email;
    }

    if (data.full_name !== undefined) setFields.full_name = data.full_name.trim();
    if (data.password_hash !== undefined) setFields.password_hash = data.password_hash;
    if (data.role !== undefined) setFields.role = data.role;
    if (data.is_active !== undefined) setFields.is_active = Boolean(data.is_active);

    await db
      .collection(MONGO_COLLECTIONS.USERS)
      .updateOne({ id: Number(id), deleted_at: null }, { $set: setFields });

    await db.collection(MONGO_COLLECTIONS.AUDIT_LOGS).insertOne({
      user_id: Number(updatedBy),
      action: 'UPDATE',
      entity: 'user',
      entity_id: String(id),
      old_data: { email: existing.email, role: existing.role },
      new_data: data,
      created_at: new Date(),
    });

    const updated = await this.findById(id);
    if (!updated) throw new Error(`User #${id} not found after update`);
    return updated;
  }

  async softDelete(id: number, deletedBy: number): Promise<void> {
    const db = await getMongoDb();
    const existing = await this.findById(id);
    if (!existing) throw new Error(`User #${id} not found`);

    const now = new Date();
    await db
      .collection(MONGO_COLLECTIONS.USERS)
      .updateOne({ id: Number(id), deleted_at: null }, { $set: { deleted_at: now } });

    await db.collection(MONGO_COLLECTIONS.AUDIT_LOGS).insertOne({
      user_id: Number(deletedBy),
      action: 'DELETE',
      entity: 'user',
      entity_id: String(id),
      old_data: { email: existing.email, role: existing.role },
      new_data: null,
      created_at: now,
    });
  }

  async updateLastLogin(id: number): Promise<void> {
    const db = await getMongoDb();
    await db
      .collection(MONGO_COLLECTIONS.USERS)
      .updateOne({ id: Number(id), deleted_at: null }, { $set: { last_login_at: new Date() } });
  }
}

export const mongoUserRepository = new MongoUserRepository();
