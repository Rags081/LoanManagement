import { z } from 'zod';

// ==========================================
// 1. Common Schemas
// ==========================================
export const idSchema = z.union([z.string().min(1, 'ID is required'), z.number().int().positive()]);

export const amountSchema = z
  .union([z.number(), z.string()])
  .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: 'Amount must be a positive number',
  });

export const nonNegativeAmountSchema = z
  .union([z.number(), z.string()])
  .refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
    message: 'Amount cannot be negative',
  });

export const rateSchema = z
  .union([z.number(), z.string()])
  .refine((val) => !isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 100, {
    message: 'Interest rate must be between 0% and 100%',
  });

export const dateSchema = z.string().refine((val) => !isNaN(Date.parse(val)), {
  message: 'Invalid date format (expected YYYY-MM-DD)',
});

export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\d{10}$/, 'Phone number must be exactly 10 digits');

export const emailSchema = z
  .string()
  .trim()
  .email('Please enter a valid email address')
  .or(z.literal(''));

export const pinCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, 'Please enter a valid 6-digit PIN code')
  .optional()
  .or(z.literal(''));

// ==========================================
// 2. Borrower Schema
// ==========================================
export const borrowerSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters'),
  phone: phoneSchema,
  email: emailSchema.optional().nullable(),
  address: z.string().trim().max(500, 'Address is too long').optional().nullable(),
  notes: z.string().trim().max(1000, 'Notes are too long').optional().nullable(),
  status: z.enum(['active', 'inactive', 'blacklisted']).default('active'),
});

export type BorrowerSchemaType = z.infer<typeof borrowerSchema>;

export const borrowerUpdateSchema = borrowerSchema.partial();
export type BorrowerUpdateSchemaType = z.infer<typeof borrowerUpdateSchema>;

export const borrowerFilterSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
  status: z.enum(['active', 'inactive', 'blacklisted', 'all']).optional(),
  search: z.string().trim().optional(),
});

export type BorrowerFilterSchemaType = z.infer<typeof borrowerFilterSchema>;

// ==========================================
// 3. Loan Schema
// ==========================================
export const loanSchema = z.object({
  borrowerId: z.coerce.number().int().positive('Please select a valid borrower'),
  principalAmount: amountSchema,
  interestRate: rateSchema,
  interestRateType: z.enum(['monthly', 'daily', 'flat']).default('monthly'),
  tenure: z.coerce.number().int().positive().optional().nullable(),
  tenureUnit: z.enum(['days', 'months', 'years']).optional().nullable(),
  loanGivenDate: dateSchema,
  dueDate: dateSchema.optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
});

export type LoanSchemaType = z.infer<typeof loanSchema>;

export const loanUpdateSchema = z.object({
  principalAmount: amountSchema.optional(),
  interestRate: rateSchema.optional(),
  interestRateType: z.enum(['monthly', 'daily', 'flat']).optional(),
  tenure: z.coerce.number().int().positive().optional().nullable(),
  tenureUnit: z.enum(['days', 'months', 'years']).optional().nullable(),
  loanGivenDate: dateSchema.optional(),
  dueDate: dateSchema.optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
  status: z.enum(['active', 'overdue', 'completed', 'cancelled']).optional(),
  settlementDate: dateSchema.optional().nullable(),
});

export type LoanUpdateSchemaType = z.infer<typeof loanUpdateSchema>;

export const loanFilterSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
  borrowerId: z.coerce.number().int().positive().optional(),
  status: z.enum(['active', 'overdue', 'completed', 'cancelled', 'all']).optional(),
  startDate: dateSchema.optional(),
  endDate: dateSchema.optional(),
  minRate: z.coerce.number().nonnegative().optional(),
  maxRate: z.coerce.number().nonnegative().optional(),
  search: z.string().trim().optional(),
});

export type LoanFilterSchemaType = z.infer<typeof loanFilterSchema>;

// ==========================================
// 4. Payment Schema
// ==========================================
export const paymentSchema = z.object({
  loanId: z.coerce.number().int().positive('Please select a valid loan'),
  paymentDate: dateSchema,
  paymentAmount: amountSchema,
  principalPortion: nonNegativeAmountSchema.optional(),
  interestPortion: nonNegativeAmountSchema.optional(),
  paymentMode: z.enum(['cash', 'upi', 'bank_transfer', 'other']).default('cash'),
  referenceNumber: z.string().trim().max(100).optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
  allocationMethod: z.enum(['interest_first', 'principal_first', 'proportional']).optional(),
});

export type PaymentSchemaType = z.infer<typeof paymentSchema>;

export const paymentFilterSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
  loanId: z.coerce.number().int().positive().optional(),
  borrowerId: z.coerce.number().int().positive().optional(),
  paymentMode: z.enum(['cash', 'upi', 'bank_transfer', 'other', 'all']).optional(),
  isVoid: z.coerce.boolean().optional(),
  startDate: dateSchema.optional(),
  endDate: dateSchema.optional(),
  search: z.string().trim().optional(),
});

export type PaymentFilterSchemaType = z.infer<typeof paymentFilterSchema>;

export const paymentVoidSchema = z.object({
  voidReason: z.string().trim().min(3, 'Void reason must be at least 3 characters').max(500),
});

export type PaymentVoidSchemaType = z.infer<typeof paymentVoidSchema>;

// ==========================================
// 5. Capital Schema
// ==========================================
export const capitalSchema = z.object({
  transactionDate: dateSchema,
  transactionType: z.enum(['capital_given', 'capital_returned', 'adjustment']),
  amount: amountSchema,
  source: z.string().trim().max(100).optional().nullable(),
  destination: z.string().trim().max(100).optional().nullable(),
  description: z.string().trim().max(255).optional().nullable(),
  referenceNumber: z.string().trim().max(100).optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
});

export type CapitalSchemaType = z.infer<typeof capitalSchema>;
export const capitalTransactionSchema = capitalSchema;
export type CapitalTransactionSchemaType = CapitalSchemaType;

export const capitalUpdateSchema = capitalSchema.partial();
export type CapitalUpdateSchemaType = z.infer<typeof capitalUpdateSchema>;

export const capitalFilterSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
  transactionType: z.enum(['capital_given', 'capital_returned', 'adjustment', 'all']).optional(),
  startDate: dateSchema.optional(),
  endDate: dateSchema.optional(),
  search: z.string().trim().optional(),
});

export type CapitalFilterSchemaType = z.infer<typeof capitalFilterSchema>;

// ==========================================
// 6. User & Authentication Schemas
// ==========================================
export const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginSchemaType = z.infer<typeof loginSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

export type ChangePasswordSchemaType = z.infer<typeof changePasswordSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
});

export type ForgotPasswordSchemaType = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

export type ResetPasswordSchemaType = z.infer<typeof resetPasswordSchema>;

export const userSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address'),
  fullName: z.string().trim().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['admin', 'operator', 'viewer']).default('operator'),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  isActive: z.boolean().default(true),
});

export type UserSchemaType = z.infer<typeof userSchema>;
