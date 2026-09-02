import { RowDataPacket, ResultSetHeader, PoolConnection } from 'mysql2/promise';
import { getPool } from '../database';

export interface DbUser extends RowDataPacket {
  id: number;
  email: string;
  password_hash: string;
  full_name: string;
  role: 'admin' | 'operator' | 'viewer';
  is_active: number | boolean;
  last_login_at: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
  deleted_at: Date | string | null;
}

export interface UserCreateDto {
  email: string;
  password_hash: string;
  full_name: string;
  role?: 'admin' | 'operator' | 'viewer';
  is_active?: boolean;
}

export interface UserUpdateDto {
  email?: string;
  password_hash?: string;
  full_name?: string;
  role?: 'admin' | 'operator' | 'viewer';
  is_active?: boolean;
}

export class UserRepository {
  async findById(id: number, connection?: PoolConnection): Promise<DbUser | null> {
    const conn = connection || getPool();
    const [rows] = await conn.query<DbUser[]>(
      'SELECT * FROM users WHERE id = ? AND deleted_at IS NULL LIMIT 1',
      [id]
    );
    return rows[0] || null;
  }

  async findByEmail(email: string, connection?: PoolConnection): Promise<DbUser | null> {
    const conn = connection || getPool();
    const [rows] = await conn.query<DbUser[]>(
      'SELECT * FROM users WHERE email = ? AND deleted_at IS NULL LIMIT 1',
      [email.toLowerCase().trim()]
    );
    return rows[0] || null;
  }

  async create(userData: UserCreateDto, connection?: PoolConnection): Promise<DbUser> {
    const conn = connection || getPool();
    const [res] = await conn.execute<ResultSetHeader>(
      `INSERT INTO users (email, password_hash, full_name, role, is_active)
       VALUES (?, ?, ?, ?, ?)`,
      [
        userData.email.toLowerCase().trim(),
        userData.password_hash,
        userData.full_name.trim(),
        userData.role || 'operator',
        userData.is_active !== undefined ? userData.is_active : true,
      ]
    );

    const created = await this.findById(res.insertId, connection);
    if (!created) {
      throw new Error('Failed to retrieve newly created user record');
    }
    return created;
  }

  async update(id: number, data: UserUpdateDto, connection?: PoolConnection): Promise<DbUser> {
    const conn = connection || getPool();
    const updates: string[] = [];
    const values: unknown[] = [];

    if (data.email !== undefined) {
      updates.push('email = ?');
      values.push(data.email.toLowerCase().trim());
    }
    if (data.password_hash !== undefined) {
      updates.push('password_hash = ?');
      values.push(data.password_hash);
    }
    if (data.full_name !== undefined) {
      updates.push('full_name = ?');
      values.push(data.full_name.trim());
    }
    if (data.role !== undefined) {
      updates.push('role = ?');
      values.push(data.role);
    }
    if (data.is_active !== undefined) {
      updates.push('is_active = ?');
      values.push(data.is_active);
    }

    if (updates.length === 0) {
      const existing = await this.findById(id, connection);
      if (!existing) throw new Error(`User #${id} not found`);
      return existing;
    }

    values.push(id);
    await conn.execute<ResultSetHeader>(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ? AND deleted_at IS NULL`,
      values
    );

    const updated = await this.findById(id, connection);
    if (!updated) {
      throw new Error(`User #${id} not found after update`);
    }
    return updated;
  }

  async updateLastLogin(id: number, connection?: PoolConnection): Promise<void> {
    const conn = connection || getPool();
    await conn.execute<ResultSetHeader>(
      'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ? AND deleted_at IS NULL',
      [id]
    );
  }

  async softDelete(id: number, connection?: PoolConnection): Promise<void> {
    const conn = connection || getPool();
    await conn.execute<ResultSetHeader>(
      'UPDATE users SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND deleted_at IS NULL',
      [id]
    );
  }
}

export const userRepository = new UserRepository();
export default userRepository;
