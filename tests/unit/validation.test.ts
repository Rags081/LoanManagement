import { describe, it, expect } from 'vitest';
import {
  borrowerSchema,
  loanSchema,
  paymentSchema,
  capitalSchema,
  capitalTransactionSchema,
  capitalUpdateSchema,
  loginSchema,
  phoneSchema,
  rateSchema,
  amountSchema,
} from '../../src/utils/validation';

describe('Validation Schemas Unit Tests', () => {
  describe('Primitive Schemas', () => {
    it('phoneSchema should accept valid 10-digit phone', () => {
      expect(phoneSchema.safeParse('9876543210').success).toBe(true);
    });

    it('phoneSchema should reject invalid length or non-digits', () => {
      expect(phoneSchema.safeParse('12345').success).toBe(false);
      expect(phoneSchema.safeParse('98765432101').success).toBe(false);
      expect(phoneSchema.safeParse('98765abcde').success).toBe(false);
    });

    it('rateSchema should accept 0% to 100%', () => {
      expect(rateSchema.safeParse(0).success).toBe(true);
      expect(rateSchema.safeParse(3.5).success).toBe(true);
      expect(rateSchema.safeParse(100).success).toBe(true);
    });

    it('rateSchema should reject negative or >100', () => {
      expect(rateSchema.safeParse(-1).success).toBe(false);
      expect(rateSchema.safeParse(105).success).toBe(false);
    });

    it('amountSchema should accept positive amounts only', () => {
      expect(amountSchema.safeParse(100).success).toBe(true);
      expect(amountSchema.safeParse('5000').success).toBe(true);
      expect(amountSchema.safeParse(0).success).toBe(false);
      expect(amountSchema.safeParse(-50).success).toBe(false);
    });
  });

  describe('Borrower Schema', () => {
    it('should validate valid borrower data', () => {
      const data = {
        fullName: 'Rahul Sharma',
        phone: '9876543210',
        email: 'rahul@example.com',
        address: '123 Main Street',
      };
      expect(borrowerSchema.safeParse(data).success).toBe(true);
    });

    it('should fail on short name or missing phone', () => {
      expect(borrowerSchema.safeParse({ fullName: 'R', phone: '9876543210' }).success).toBe(false);
      expect(borrowerSchema.safeParse({ fullName: 'Rahul' }).success).toBe(false);
    });
  });

  describe('Loan Schema', () => {
    it('should validate valid loan data', () => {
      const data = {
        borrowerId: 1,
        principalAmount: 10000,
        interestRate: 3,
        interestRateType: 'monthly',
        loanGivenDate: '2026-09-01',
      };
      expect(loanSchema.safeParse(data).success).toBe(true);
    });

    it('should reject invalid date or 0 principal', () => {
      expect(
        loanSchema.safeParse({
          borrowerId: 1,
          principalAmount: 0,
          interestRate: 3,
          loanGivenDate: '2026-09-01',
        }).success
      ).toBe(false);

      expect(
        loanSchema.safeParse({
          borrowerId: 1,
          principalAmount: 10000,
          interestRate: 3,
          loanGivenDate: 'invalid-date',
        }).success
      ).toBe(false);
    });
  });

  describe('Payment Schema', () => {
    it('should validate valid payment data', () => {
      const data = {
        loanId: 1,
        paymentDate: '2026-09-02',
        paymentAmount: 500,
        paymentMode: 'upi',
      };
      expect(paymentSchema.safeParse(data).success).toBe(true);
    });
  });

  describe('Capital & Login Schemas', () => {
    it('should validate capital transaction with all fields', () => {
      const data = {
        transactionDate: '2026-09-02',
        transactionType: 'capital_given',
        amount: 25000,
        source: 'Bank Account 1',
        destination: 'Cash Register',
        description: 'Initial capital injection',
        referenceNumber: 'REF-12345',
        notes: 'Verified by director',
      };
      expect(capitalSchema.safeParse(data).success).toBe(true);
      expect(capitalTransactionSchema.safeParse(data).success).toBe(true);
    });

    it('should validate capital update with partial fields', () => {
      expect(capitalUpdateSchema.safeParse({ amount: 30000 }).success).toBe(true);
      expect(capitalUpdateSchema.safeParse({ description: 'Updated note' }).success).toBe(true);
      expect(capitalUpdateSchema.safeParse({ transactionType: 'capital_returned' }).success).toBe(true);
      expect(capitalUpdateSchema.safeParse({ transactionType: 'invalid_type' }).success).toBe(false);
      expect(capitalUpdateSchema.safeParse({ amount: -500 }).success).toBe(false);
    });

    it('should reject invalid capital transactions', () => {
      expect(capitalSchema.safeParse({ transactionDate: '2026-09-02', amount: 1000 }).success).toBe(false); // missing transactionType
      expect(capitalSchema.safeParse({ transactionType: 'capital_given', amount: 1000 }).success).toBe(false); // missing date
      expect(capitalSchema.safeParse({ transactionDate: '2026-09-02', transactionType: 'capital_given', amount: 0 }).success).toBe(false); // amount 0
    });

    it('should validate login credentials', () => {
      expect(loginSchema.safeParse({ email: 'admin@loanmanagement.com', password: 'password123' }).success).toBe(true);
      expect(loginSchema.safeParse({ email: 'not-an-email', password: '123' }).success).toBe(false);
      expect(loginSchema.safeParse({ email: '', password: '' }).success).toBe(false);
    });
  });
});
