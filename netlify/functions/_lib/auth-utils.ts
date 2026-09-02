import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { HandlerEvent } from '@netlify/functions';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_dev_jwt_secret_key_32bytes_long!';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '24h';
const JWT_RESET_EXPIRY = process.env.JWT_RESET_EXPIRY || '1h';

export interface JwtUserPayload {
  id: number;
  email: string;
  role: 'admin' | 'operator' | 'viewer';
  type?: 'access' | 'reset';
}

/**
 * Generate standard access JWT token
 */
export const generateToken = (
  user: { id: number; email: string; role: 'admin' | 'operator' | 'viewer' },
  expiresIn: string = JWT_EXPIRY
): string => {
  const payload: JwtUserPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
    type: 'access',
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn } as jwt.SignOptions);
};

/**
 * Generate short-lived password reset token
 */
export const generateResetToken = (
  user: { id: number; email: string; role: 'admin' | 'operator' | 'viewer' }
): string => {
  const payload: JwtUserPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
    type: 'reset',
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_RESET_EXPIRY } as jwt.SignOptions);
};

/**
 * Verify and decode JWT token
 */
export const verifyToken = (token: string): JwtUserPayload => {
  return jwt.verify(token, JWT_SECRET) as JwtUserPayload;
};

/**
 * Extract Bearer token from Netlify HandlerEvent
 */
export const extractToken = (event: HandlerEvent): string | null => {
  const authHeader = event.headers?.authorization || event.headers?.Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7).trim();
};

/**
 * Hash password with bcrypt using 12 salt rounds
 */
export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(12);
  return await bcrypt.hash(password, salt);
};

/**
 * Verify password against bcrypt hash
 */
export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};

export default {
  generateToken,
  generateResetToken,
  verifyToken,
  extractToken,
  hashPassword,
  verifyPassword,
};
