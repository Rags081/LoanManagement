import { z } from 'zod';
import { requireAuth, AuthenticatedEvent, corsHeaders } from '../_lib/auth-middleware';
import { userRepository } from '../_lib/repositories/user.repository';
import { verifyPassword, hashPassword } from '../_lib/auth-utils';
import { withTransaction, execute } from '../_lib/database';
import { getClientIp } from '../_lib/rate-limit';

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

export const handler = requireAuth(async (event: AuthenticatedEvent) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const parseResult = changePasswordSchema.safeParse(body);
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

    const { currentPassword, newPassword } = parseResult.data;
    const userId = event.user.id;

    const user = await userRepository.findById(userId);
    if (!user) {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'User not found' }),
      };
    }

    // Verify current password
    const isCurrentValid = await verifyPassword(currentPassword, user.password_hash);
    if (!isCurrentValid) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Bad Request',
          message: 'Incorrect current password',
        }),
      };
    }

    // Hash new password and update inside transaction
    const newHash = await hashPassword(newPassword);
    await withTransaction(async (conn) => {
      await userRepository.update(userId, { password_hash: newHash }, conn);
    });

    const ip = getClientIp(event);
    await execute(
      `INSERT INTO audit_logs (user_id, action, entity, entity_id, ip_address, user_agent)
       VALUES (?, 'CHANGE_PASSWORD', 'user', ?, ?, ?)`,
      [userId, String(userId), ip, event.headers['user-agent'] || null]
    ).catch(() => {});

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        message: 'Password changed successfully',
      }),
    };
  } catch (error) {
    console.error('Change password error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Internal Server Error',
        message: 'Failed to change password',
      }),
    };
  }
});
