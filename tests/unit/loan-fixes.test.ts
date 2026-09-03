import { describe, it, expect } from 'vitest';
import { formatCurrency, formatCurrencyShort, toSafeAmount, toDecimal } from '../../src/utils/currency';
import { LoanSummary } from '../../src/types/loan';
import { loanRepository as mysqlLoanRepo } from '../../netlify/functions/_lib/repositories/loan.repository';
import { mongoLoanRepository } from '../../netlify/functions/_lib/repositories/mongo/loan.repository.mongo';

describe('Regression Tests: Loan Calculations, Details, and Status Updates', () => {
  describe('Issue #1: Currency formatting & safe numeric arithmetic (prevent NaN)', () => {
    it('toSafeAmount converts various inputs to valid numbers', () => {
      expect(toSafeAmount(100)).toBe(100);
      expect(toSafeAmount('100.50')).toBe(100.5);
      expect(toSafeAmount('₹ 1,500.00')).toBe(1500);
      expect(toSafeAmount(null)).toBe(0);
      expect(toSafeAmount(undefined)).toBe(0);
      expect(toSafeAmount(NaN)).toBe(0);
      expect(toSafeAmount('')).toBe(0);
    });

    it('toDecimal and formatCurrency never produce NaN output', () => {
      expect(formatCurrency(NaN)).toBe('₹ 0.00');
      expect(formatCurrency(null)).toBe('₹ 0.00');
      expect(formatCurrency(undefined)).toBe('₹ 0.00');
      expect(formatCurrency(5000)).toBe('₹ 5,000.00');
      expect(formatCurrency('2500.75')).toBe('₹ 2,500.75');

      expect(formatCurrencyShort(NaN)).toBe('₹ 0');
      expect(formatCurrencyShort(null)).toBe('₹ 0');
    });

    it('LoanSummaryCards total recovered calculation produces a valid number', () => {
      const mockSummary: LoanSummary = {
        totalLoans: 3,
        activeLoans: 0,
        overdueLoans: 0,
        completedLoans: 3,
        cancelledLoans: 0,
        totalPrincipalLent: 20000,
        totalExpectedInterest: 1500,
        totalExpectedRepayment: 21500,
        totalPrincipalRecovered: 20000,
        totalInterestRecovered: 1500,
        totalOutstanding: 0,
      };

      const totalRecovered = mockSummary.totalPrincipalRecovered + mockSummary.totalInterestRecovered;
      expect(isNaN(totalRecovered)).toBe(false);
      expect(totalRecovered).toBe(21500);
      expect(formatCurrency(totalRecovered)).toBe('₹ 21,500.00');

      // Test with legacy or partial keys
      const partialSummary: Partial<LoanSummary> & { principalCollected?: number; interestCollected?: number } = {
        totalLoans: 3,
        completedLoans: 3,
        principalCollected: 20000,
        interestCollected: 1500,
      };

      const safeTotalRecovered =
        toSafeAmount(partialSummary.totalPrincipalRecovered ?? partialSummary.principalCollected) +
        toSafeAmount(partialSummary.totalInterestRecovered ?? partialSummary.interestCollected);

      expect(isNaN(safeTotalRecovered)).toBe(false);
      expect(safeTotalRecovered).toBe(21500);
      expect(formatCurrency(safeTotalRecovered)).toBe('₹ 21,500.00');
    });
  });

  describe('Issue #2 & #3: Interface contract parity between MySQL and MongoDB repositories', () => {
    it('Both MySQL and MongoDB loan repositories implement required methods', () => {
      const requiredMethods = [
        'findAll',
        'findById',
        'findByLoanId',
        'findByBorrower',
        'create',
        'update',
        'updateStatus',
        'delete',
        'softDelete',
        'calculateOutstanding',
        'getLoanSummary',
        'getLoanPayments',
        'getOverdueLoans',
      ];

      for (const method of requiredMethods) {
        expect(
          typeof (mysqlLoanRepo as unknown as Record<string, unknown>)[method],
          `MySQL repo missing method: ${method}`
        ).toBe('function');
        expect(
          typeof (mongoLoanRepository as unknown as Record<string, unknown>)[method],
          `Mongo repo missing method: ${method}`
        ).toBe('function');
      }
    });
  });
});
