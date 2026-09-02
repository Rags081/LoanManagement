import { requireAuth, AuthenticatedEvent, corsHeaders } from '../_lib/auth-middleware';
import { execute } from '../_lib/database';
import { getClientIp } from '../_lib/rate-limit';

export const handler = requireAuth(async (event: AuthenticatedEvent) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  const userId = event.user.id;
  const ip = getClientIp(event);

  // Log logout in audit logs
  await execute(
    `INSERT INTO audit_logs (user_id, action, entity, entity_id, ip_address, user_agent)
     VALUES (?, 'LOGOUT', 'user', ?, ?, ?)`,
    [userId, String(userId), ip, event.headers['user-agent'] || null]
  ).catch(() => {});

  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({
      success: true,
      message: 'Logged out successfully',
    }),
  };
});
