import { HandlerEvent, HandlerResponse } from '@netlify/functions';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

const WINDOW_MS = process.env.RATE_LIMIT_WINDOW_MS
  ? parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10)
  : 15 * 60 * 1000; // 15 mins default
const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '5', 10); // 5 attempts default

/**
 * Extract client IP from Netlify HandlerEvent
 */
export const getClientIp = (event: HandlerEvent): string => {
  return (
    event.headers['x-nf-client-connection-ip'] ||
    event.headers['x-forwarded-for']?.split(',')[0].trim() ||
    event.headers['client-ip'] ||
    '127.0.0.1'
  );
};

/**
 * Check if the request from the client IP exceeds rate limit
 */
export const checkRateLimit = (
  key: string,
  maxRequests: number = MAX_REQUESTS,
  windowMs: number = WINDOW_MS
): { allowed: boolean; remaining: number; retryAfter: number } => {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, retryAfter: 0 };
  }

  if (record.count >= maxRequests) {
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);
    return { allowed: false, remaining: 0, retryAfter };
  }

  record.count += 1;
  return { allowed: true, remaining: maxRequests - record.count, retryAfter: 0 };
};

/**
 * Helper to generate a 429 Rate Limit Exceeded response
 */
export const rateLimitExceededResponse = (retryAfter: number): HandlerResponse => {
  return {
    statusCode: 429,
    headers: {
      'Content-Type': 'application/json',
      'Retry-After': String(retryAfter),
    },
    body: JSON.stringify({
      error: 'Too Many Requests',
      message: `Too many login attempts. Please try again in ${Math.ceil(retryAfter / 60)} minutes.`,
      retryAfter,
    }),
  };
};

export default {
  getClientIp,
  checkRateLimit,
  rateLimitExceededResponse,
};
