import { describe, it, expect, vi } from 'vitest';
import { handler as authRouterHandler } from '../../netlify/functions/auth';
import type { HandlerEvent, HandlerContext } from '@netlify/functions';

vi.mock('../../netlify/functions/auth/login', () => ({
  handler: vi.fn().mockResolvedValue({
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: 'mock-token', user: { id: 1, email: 'admin@loanmanagement.com' } }),
  }),
}));

vi.mock('../../netlify/functions/auth/logout', () => ({
  handler: vi.fn().mockResolvedValue({
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ success: true, message: 'Logged out successfully' }),
  }),
}));

vi.mock('../../netlify/functions/auth/verify', () => ({
  handler: vi.fn().mockResolvedValue({
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ valid: true, user: { id: 1, email: 'admin@loanmanagement.com' } }),
  }),
}));

vi.mock('../../netlify/functions/auth/change-password', () => ({
  handler: vi.fn().mockResolvedValue({
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ success: true, message: 'Password changed successfully' }),
  }),
}));

vi.mock('../../netlify/functions/auth/forgot-password', () => ({
  handler: vi.fn().mockResolvedValue({
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ success: true, message: 'Password reset link dispatched' }),
  }),
}));

vi.mock('../../netlify/functions/auth/reset-password', () => ({
  handler: vi.fn().mockResolvedValue({
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ success: true, message: 'Password reset complete' }),
  }),
}));

describe('Netlify Functions Auth Router Unit Tests', () => {
  const dummyContext: HandlerContext = {} as HandlerContext;

  const createEvent = (path: string, httpMethod: string = 'POST', body?: string): HandlerEvent => ({
    rawUrl: `http://localhost:5173${path}`,
    rawQuery: '',
    path,
    httpMethod,
    headers: { 'content-type': 'application/json' },
    multiValueHeaders: {},
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    body: body || null,
    isBase64Encoded: false,
  });

  it('should handle OPTIONS preflight with 204 status', async () => {
    const event = createEvent('/api/auth/login', 'OPTIONS');
    const res = await authRouterHandler(event, dummyContext);
    expect(res.statusCode).toBe(204);
  });

  it('should route /api/auth/login to loginHandler', async () => {
    const event = createEvent('/api/auth/login', 'POST', JSON.stringify({ email: 'admin@loanmanagement.com', password: 'Admin@123' }));
    const res = await authRouterHandler(event, dummyContext);
    expect(res.statusCode).toBe(200);
    const parsed = JSON.parse(res.body || '{}');
    expect(parsed.token).toBe('mock-token');
  });

  it('should route /api/auth/logout to logoutHandler', async () => {
    const event = createEvent('/api/auth/logout', 'POST');
    const res = await authRouterHandler(event, dummyContext);
    expect(res.statusCode).toBe(200);
    const parsed = JSON.parse(res.body || '{}');
    expect(parsed.success).toBe(true);
  });

  it('should route /api/auth/verify to verifyHandler', async () => {
    const event = createEvent('/api/auth/verify', 'GET');
    const res = await authRouterHandler(event, dummyContext);
    expect(res.statusCode).toBe(200);
    const parsed = JSON.parse(res.body || '{}');
    expect(parsed.valid).toBe(true);
  });

  it('should route /api/auth/change-password to changePasswordHandler', async () => {
    const event = createEvent('/api/auth/change-password', 'POST');
    const res = await authRouterHandler(event, dummyContext);
    expect(res.statusCode).toBe(200);
  });

  it('should route /api/auth/forgot-password to forgotPasswordHandler', async () => {
    const event = createEvent('/api/auth/forgot-password', 'POST');
    const res = await authRouterHandler(event, dummyContext);
    expect(res.statusCode).toBe(200);
  });

  it('should route /api/auth/reset-password to resetPasswordHandler', async () => {
    const event = createEvent('/api/auth/reset-password', 'POST');
    const res = await authRouterHandler(event, dummyContext);
    expect(res.statusCode).toBe(200);
  });

  it('should return 404 for unknown auth endpoints', async () => {
    const event = createEvent('/api/auth/unknown-endpoint', 'POST');
    const res = await authRouterHandler(event, dummyContext);
    expect(res.statusCode).toBe(404);
    const parsed = JSON.parse(res.body || '{}');
    expect(parsed.error).toBe('Not Found');
  });
});
