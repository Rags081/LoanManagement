import { requireAuth, AuthenticatedEvent, corsHeaders } from '../_lib/auth-middleware';
import { userRepository } from '../_lib/repositories/user.repository';

export const handler = requireAuth(async (event: AuthenticatedEvent) => {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  const user = await userRepository.findById(event.user.id);
  if (!user || !user.is_active || user.deleted_at) {
    return {
      statusCode: 401,
      headers: corsHeaders,
      body: JSON.stringify({
        valid: false,
        message: 'User session is invalid or deactivated',
      }),
    };
  }

  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({
      valid: true,
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
});
