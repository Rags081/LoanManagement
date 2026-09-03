import { z } from 'zod';
import { requireAuth, AuthenticatedEvent, corsHeaders } from '../_lib/auth-middleware';
import { userRepository } from '../_lib/repositories';
import { verifyPassword, hashPassword } from '../_lib/auth-utils';
import { logAudit } from '../_lib/audit';
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

    // Hash new password and update
    const newHash = await hashPassword(newPassword);
    await userRepository.update(userId, { password_hash: newHash }, userId);

    const ip = getClientIp(event);
    await logAudit({
      userId,
      action: 'CHANGE_PASSWORD',
      entity: 'user',
      entityId: String(userId),
      ipAddress: ip,
      userAgent: event.headers['user-agent'] || null,
    });

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
