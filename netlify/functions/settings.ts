import { HandlerResponse } from '@netlify/functions';
import bcrypt from 'bcryptjs';
import { requireAuth, AuthenticatedEvent, corsHeaders } from './_lib/auth-middleware';
import { settingsRepository } from './_lib/repositories/settings.repository';
import { userRepository } from './_lib/repositories/user.repository';
import { getPool } from './_lib/database';

export const handler = requireAuth(async (event: AuthenticatedEvent): Promise<HandlerResponse> => {
  const method = event.httpMethod;
  const user = event.user;
  const userId = user?.id ?? (user as unknown as { userId?: number })?.userId ?? null;
  const rawPath = event.path || '';
  const query = event.queryStringParameters || {};

  const segments = rawPath.split('/').filter(Boolean);
  const lastSegment = segments[segments.length - 1];

  const isSystemInfo = lastSegment === 'system-info' || query.action === 'system-info';
  const isBackup = lastSegment === 'backup' || query.action === 'backup';
  const isReset = lastSegment === 'reset' || query.action === 'reset';
  const isChangePassword = lastSegment === 'change-password' || query.action === 'change-password';

  try {
    // ----------------------------------------------------
    // GET /api/settings/system-info
    // ----------------------------------------------------
    if (method === 'GET' && isSystemInfo) {
      const info = await settingsRepository.getSystemInfo();
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(info),
      };
    }

    // ----------------------------------------------------
    // GET /api/settings/backup
    // ----------------------------------------------------
    if (method === 'GET' && isBackup) {
      const backupData = await settingsRepository.getFullDatabaseBackup();
      const filename = `loan_management_backup_${new Date().toISOString().split('T')[0]}.json`;
      return {
        statusCode: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
        body: JSON.stringify(backupData, null, 2),
      };
    }

    // ----------------------------------------------------
    // GET /api/settings
    // ----------------------------------------------------
    if (method === 'GET') {
      const settings = await settingsRepository.getAll();
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(settings),
      };
    }

    // ----------------------------------------------------
    // POST /api/settings/reset
    // ----------------------------------------------------
    if (method === 'POST' && isReset) {
      const resetSettings = await settingsRepository.resetToDefaults(userId || undefined);
      const conn = getPool();
      await conn.execute(
        `INSERT INTO audit_logs (user_id, action, entity, entity_id, new_data)
         VALUES (?, 'RESET', 'settings', 'all', ?)`,
        [userId, JSON.stringify({ action: 'reset_to_factory_defaults' })]
      );

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          success: true,
          message: 'Settings successfully restored to factory defaults.',
          data: resetSettings,
        }),
      };
    }

    // ----------------------------------------------------
    // POST /api/settings/change-password
    // ----------------------------------------------------
    if (method === 'POST' && isChangePassword) {
      if (!userId) {
        return {
          statusCode: 401,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Unauthorized', message: 'User ID is missing from session' }),
        };
      }

      const body = JSON.parse(event.body || '{}');
      const { currentPassword, newPassword } = body;

      if (!currentPassword || !newPassword) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Bad Request', message: 'Current password and new password are required' }),
        };
      }

      if (String(newPassword).length < 6) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Bad Request', message: 'New password must be at least 6 characters long' }),
        };
      }

      const dbUser = await userRepository.findById(userId);
      if (!dbUser) {
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Not Found', message: 'User record not found' }),
        };
      }

      const isMatch = await bcrypt.compare(currentPassword, dbUser.password_hash);
      if (!isMatch) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Bad Request', message: 'Current password is incorrect' }),
        };
      }

      const newHash = await bcrypt.hash(newPassword, 10);
      await userRepository.update(userId, { password_hash: newHash });

      const conn = getPool();
      await conn.execute(
        `INSERT INTO audit_logs (user_id, action, entity, entity_id, new_data)
         VALUES (?, 'UPDATE', 'user_password', ?, ?)`,
        [userId, String(userId), JSON.stringify({ action: 'password_changed' })]
      );

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          success: true,
          message: 'Password changed successfully.',
        }),
      };
    }

    // ----------------------------------------------------
    // PUT / POST /api/settings (Update preferences)
    // ----------------------------------------------------
    if (method === 'PUT' || method === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const payload = body.settings || body;

      if (typeof payload !== 'object' || payload === null) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Bad Request', message: 'Invalid settings payload' }),
        };
      }

      await settingsRepository.setMany(payload, userId || undefined);

      const conn = getPool();
      await conn.execute(
        `INSERT INTO audit_logs (user_id, action, entity, entity_id, new_data)
         VALUES (?, 'UPDATE', 'settings', 'config', ?)`,
        [userId, JSON.stringify(payload)]
      );

      const updated = await settingsRepository.getAll();
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          success: true,
          message: 'System preferences saved successfully.',
          data: updated,
        }),
      };
    }

    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  } catch (err: unknown) {
    const errorObj = err as Error;
    console.error('Settings function error:', errorObj);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Internal Server Error',
        message: errorObj.message || 'An error occurred while managing settings',
      }),
    };
  }
});
