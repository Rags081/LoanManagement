import { Handler, HandlerEvent } from '@netlify/functions';
import { z } from 'zod';
import { userRepository } from '../_lib/repositories';
import { generateResetToken } from '../_lib/auth-utils';
import { corsHeaders } from '../_lib/auth-middleware';
import { checkRateLimit, getClientIp, rateLimitExceededResponse } from '../_lib/rate-limit';

const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
});

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  const ip = getClientIp(event);
  const rateLimit = checkRateLimit(`forgot-password:${ip}`, 3, 900000);
  if (!rateLimit.allowed) {
    return rateLimitExceededResponse(rateLimit.retryAfter);
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const parseResult = forgotPasswordSchema.safeParse(body);
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

    const { email } = parseResult.data;
    const user = await userRepository.findByEmail(email);

    // To prevent email enumeration, return 200 even if user not found
    if (user && user.is_active && !user.deleted_at) {
      const resetToken = generateResetToken({
        id: user.id,
        email: user.email,
        role: user.role,
      });

      // In production, this would dispatch an email service.
      // For local development, we provide the reset token in logs/response
      console.log(`[AUTH] Password reset requested for ${email}. Token: ${resetToken}`);
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.',
      }),
    };
  } catch (error) {
    console.error('Forgot password error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Internal Server Error',
        message: 'Failed to process password reset request',
      }),
    };
  }
};
