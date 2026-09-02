import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mysql, { Connection, PoolConnection } from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { userRepository } from '../../netlify/functions/_lib/repositories/user.repository';

describe('Auth Integration Tests', () => {
  let conn: Connection;

  beforeAll(async () => {
    conn = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'loan_management',
    });
  });

  afterAll(async () => {
    await conn.end();
  });

  it('should find admin user and verify hashed password', async () => {
    const admin = await userRepository.findByEmail('admin@loanmanagement.com', conn as unknown as PoolConnection);
    expect(admin).not.toBeNull();
    expect(admin?.role).toBe('admin');
    expect(admin?.is_active).toBeTruthy();

    const isValid = await bcrypt.compare('Admin@123', admin!.password_hash);
    expect(isValid).toBe(true);
  });

  it('should reject invalid password for user', async () => {
    const admin = await userRepository.findByEmail('admin@loanmanagement.com', conn as unknown as PoolConnection);
    expect(admin).not.toBeNull();

    const isValid = await bcrypt.compare('wrongpassword', admin!.password_hash);
    expect(isValid).toBe(false);
  });

  it('should sign and verify JWT tokens accurately', () => {
    const secret = process.env.JWT_SECRET || 'test_jwt_secret_key_1234567890';
    const payload = { id: 1, username: 'admin', role: 'admin' };
    const token = jwt.sign(payload, secret, { expiresIn: '1h' });

    const decoded = jwt.verify(token, secret) as JwtPayload & { id: number; username: string; role: string };
    expect(decoded.id).toBe(1);
    expect(decoded.username).toBe('admin');
    expect(decoded.role).toBe('admin');
  });
});
