import { ZodSchema, ZodError } from 'zod';

/**
 * Placeholder Serverless Request Validation Helper
 */
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: Record<string, string>;
}

export const validateRequestBody = <T>(
  schema: ZodSchema<T>,
  body: unknown
): ValidationResult<T> => {
  try {
    const data = schema.parse(body);
    return { success: true, data };
  } catch (err) {
    if (err instanceof ZodError) {
      const errors: Record<string, string> = {};
      err.errors.forEach((e) => {
        const path = e.path.join('.');
        errors[path] = e.message;
      });
      return { success: false, errors };
    }
    return { success: false, errors: { _general: 'Validation failed' } };
  }
};

export default {
  validateRequestBody,
};
