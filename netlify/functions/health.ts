import { Handler } from '@netlify/functions';
import { checkDatabaseHealth } from './_lib/db';

export const handler: Handler = async () => {
  const health = await checkDatabaseHealth();

  const statusCode = health.status === 'ok' ? 200 : 503;

  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
    body: JSON.stringify({
      status: health.status === 'ok' ? 'ok' : 'degraded',
      driver: health.driver,
      database: health.database,
      uptime: health.uptime,
      timestamp: health.timestamp,
      ...(health.error ? { error: health.error } : {}),
    }),
  };
};
