import { Handler, HandlerEvent } from '@netlify/functions';
import { z } from 'zod';
import { userRepository } from '../_lib/repositories';
import { verifyPassword, generateToken } from '../_lib/auth-utils';
import { checkRateLimit, getClientIp, rateLimitExceededResponse } from '../_lib/rate-limit';
import { corsHeaders } from '../_lib/auth-middleware';
import { logAudit } from '../_lib/audit';

const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  // 1. Rate limiting check
  const ip = getClientIp(event);
  const rateLimit = checkRateLimit(`login:${ip}`);
  if (!rateLimit.allowed) {
    return rateLimitExceededResponse(rateLimit.retryAfter);
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const parseResult = loginSchema.safeParse(body);
    if (!parseResult.success) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Validation Error',
          errors: parseResult.error.flatten().fieldErrors,
        }),
      };
    }

    const { email, password } = parseResult.data;

    // 2. Lookup user
    const user = await userRepository.findByEmail(email);
    if (!user) {
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Unauthorized',
          message: 'Invalid email or password',
        }),
      };
    }

    // 3. Check active state
    if (!user.is_active || user.deleted_at) {
      return {
        statusCode: 403,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Forbidden',
          message: 'Account is deactivated. Please contact an administrator.',
        }),
      };
    }

    // 4. Verify password
    const isPasswordValid = await verifyPassword(password, user.password_hash);
    if (!isPasswordValid) {
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Unauthorized',
          message: 'Invalid email or password',
        }),
      };
    }

    // 5. Update last login
    await userRepository.updateLastLogin(user.id);

    // 6. Generate JWT token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // 7. Audit log
    await logAudit({
      userId: user.id,
      action: 'LOGIN',
      entity: 'user',
      entityId: String(user.id),
      ipAddress: ip,
      userAgent: event.headers['user-agent'] || null,
    });

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        token,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          role: user.role,
          isActive: Boolean(user.is_active),
          lastLoginAt: user.last_login_at,
          createdAt: user.created_at,
          updatedAt: user.updated_at,
        },
      }),
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred during login',
      }),
    };
  }
};
