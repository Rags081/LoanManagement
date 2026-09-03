import { HandlerEvent, HandlerContext, HandlerResponse } from '@netlify/functions';
import { extractToken, verifyToken, JwtUserPayload } from './auth-utils';
import { userRepository } from './repositories';

export interface AuthenticatedEvent extends HandlerEvent {
  user: JwtUserPayload;
}

export type AuthenticatedHandler = (
  event: AuthenticatedEvent,
  context: HandlerContext
) => Promise<HandlerResponse>;

/**
 * Standard CORS headers
 */
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Content-Type': 'application/json',
};

/**
 * Middleware requiring valid JWT token
 */
export const requireAuth = (handler: AuthenticatedHandler) => {
  return async (event: HandlerEvent, context: HandlerContext): Promise<HandlerResponse> => {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      return { statusCode: 204, headers: corsHeaders, body: '' };
    }

    const token = extractToken(event);
    if (!token) {
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Unauthorized',
          message: 'Authentication token is required',
        }),
      };
    }

    try {
      const decoded = verifyToken(token);

      // Verify user is still active in database
      const dbUser = await userRepository.findById(decoded.id);
      if (!dbUser || !dbUser.is_active || dbUser.deleted_at) {
        return {
          statusCode: 401,
          headers: corsHeaders,
          body: JSON.stringify({
            error: 'Unauthorized',
            message: 'User account is deactivated or not found',
          }),
        };
      }

      (event as AuthenticatedEvent).user = decoded;
      return await handler(event as AuthenticatedEvent, context);
    } catch (err: unknown) {
      const isExpired = (err as Error)?.name === 'TokenExpiredError';
      return {
        statusCode: isExpired ? 403 : 401,
        headers: corsHeaders,
        body: JSON.stringify({
          error: isExpired ? 'Forbidden' : 'Unauthorized',
          message: isExpired ? 'Session expired. Please log in again.' : 'Invalid authentication token',
        }),
      };
    }
  };
};

/**
 * Middleware requiring specific role(s)
 */
export const requireRole = (allowedRoles: ('admin' | 'operator' | 'viewer')[]) => {
  return (handler: AuthenticatedHandler) => {
    return requireAuth(async (event: AuthenticatedEvent, context: HandlerContext) => {
      const userRole = event.user.role;
      if (!allowedRoles.includes(userRole)) {
        return {
          statusCode: 403,
          headers: corsHeaders,
          body: JSON.stringify({
            error: 'Forbidden',
            message: `Access denied. Requires one of roles: ${allowedRoles.join(', ')}`,
          }),
        };
      }
      return await handler(event, context);
    });
  };
};

/**
 * Middleware requiring Admin role
 */
export const requireAdmin = requireRole(['admin']);

export default {
  requireAuth,
  requireRole,
  requireAdmin,
  corsHeaders,
};
