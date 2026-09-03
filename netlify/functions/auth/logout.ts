import { requireAuth, AuthenticatedEvent, corsHeaders } from '../_lib/auth-middleware';
import { logAudit } from '../_lib/audit';
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
  await logAudit({
    userId,
    action: 'LOGOUT',
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
      message: 'Logged out successfully',
    }),
  };
});
