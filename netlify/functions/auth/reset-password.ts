import { Handler, HandlerEvent } from '@netlify/functions';
import { z } from 'zod';
import { userRepository } from '../_lib/repositories';
import { verifyToken, hashPassword } from '../_lib/auth-utils';
import { corsHeaders } from '../_lib/auth-middleware';
import { logAudit } from '../_lib/audit';
import { getClientIp } from '../_lib/rate-limit';

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
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

  try {
    const body = JSON.parse(event.body || '{}');
    const parseResult = resetPasswordSchema.safeParse(body);
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

    const { token, newPassword } = parseResult.data;

    // Verify token
    let payload;
    try {
      payload = verifyToken(token);
      if (payload.type !== 'reset') {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({
            error: 'Bad Request',
            message: 'Invalid reset token type',
          }),
        };
      }
    } catch {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Bad Request',
          message: 'Reset token is invalid or has expired',
        }),
      };
    }

    const user = await userRepository.findById(payload.id);
    if (!user || !user.is_active || user.deleted_at) {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Not Found',
          message: 'User account not found or deactivated',
        }),
      };
    }

    const newHash = await hashPassword(newPassword);
    await userRepository.update(user.id, { password_hash: newHash }, user.id);

    const ip = getClientIp(event);
    await logAudit({
      userId: user.id,
      action: 'RESET_PASSWORD',
      entity: 'user',
      entityId: String(user.id),
      ipAddress: ip,
      userAgent: event.headers['user-agent'] || null,
    });

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        message: 'Password has been reset successfully. Please log in with your new password.',
      }),
    };
  } catch (error) {
    console.error('Reset password error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Internal Server Error',
        message: 'Failed to reset password',
      }),
    };
  }
};
