import { Handler, HandlerEvent, HandlerContext, HandlerResponse } from '@netlify/functions';
import { handler as loginHandler } from './auth/login';
import { handler as logoutHandler } from './auth/logout';
import { handler as verifyHandler } from './auth/verify';
import { handler as changePasswordHandler } from './auth/change-password';
import { handler as forgotPasswordHandler } from './auth/forgot-password';
import { handler as resetPasswordHandler } from './auth/reset-password';
import { corsHeaders } from './_lib/auth-middleware';

/**
 * Top-level Netlify Function Router for Authentication endpoints.
 * Dispatches requests to existing specialized auth handlers:
 * - /api/auth/login           -> loginHandler
 * - /api/auth/logout          -> logoutHandler
 * - /api/auth/verify          -> verifyHandler
 * - /api/auth/change-password -> changePasswordHandler
 * - /api/auth/forgot-password -> forgotPasswordHandler
 * - /api/auth/reset-password  -> resetPasswordHandler
 */
export const handler: Handler = async (
  event: HandlerEvent,
  context: HandlerContext
): Promise<HandlerResponse> => {
  // Handle CORS preflight for all auth routes
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: corsHeaders,
      body: '',
    };
  }

  // Extract action/sub-route from the path
  const rawPath = event.path || '';
  const segments = rawPath.split('?')[0].split('/').filter(Boolean);
  const lastSegment = segments[segments.length - 1] || '';
  const queryAction = event.queryStringParameters?.action || '';

  const action = lastSegment.toLowerCase() || queryAction.toLowerCase();

  switch (action) {
    case 'login':
      return loginHandler(event, context) as Promise<HandlerResponse>;

    case 'logout':
      return logoutHandler(event, context) as Promise<HandlerResponse>;

    case 'verify':
      return verifyHandler(event, context) as Promise<HandlerResponse>;

    case 'change-password':
    case 'changepassword':
      return changePasswordHandler(event, context) as Promise<HandlerResponse>;

    case 'forgot-password':
    case 'forgotpassword':
      return forgotPasswordHandler(event, context) as Promise<HandlerResponse>;

    case 'reset-password':
    case 'resetpassword':
      return resetPasswordHandler(event, context) as Promise<HandlerResponse>;

    default:
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Not Found',
          message: `Unknown auth endpoint: ${rawPath}. Supported endpoints: login, logout, verify, change-password, forgot-password, reset-password.`,
        }),
      };
  }
};

export default handler;
