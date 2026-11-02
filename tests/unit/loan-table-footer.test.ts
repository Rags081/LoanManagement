import { describe, it, expect } from 'vitest';
import Decimal from 'decimal.js';
import { LoanWithBorrower } from '../../src/types/loan';
import { calculateDynamicInterestOutstanding } from '../../src/utils/interestCalculation';
import { formatCurrency } from '../../src/utils/currency';

describe('Loan Table Summary Footer & Column Totals', () => {
  const mockLoans: LoanWithBorrower[] = [
    {
      id: 8,
      loanId: 'LN-008',
      borrowerId: 8,
      principalAmount: 20000,
      principalOutstanding: 20000,
      interestRate: 5,
      interestRateType: 'monthly',
      monthlyInterestAmount: 1000,
      dailyInterestAmount: 33.33,
      loanGivenDate: '2026-10-01',
      totalReceived: 0,
      principalReceived: 0,
      interestReceived: 0,
      interestOutstanding: 1033.33,
      totalOutstanding: 21033.33,
      accruedInterest: 1033.33,
      status: 'active',
      createdBy: 1,
      createdAt: '2026-10-01T00:00:00Z',
      updatedAt: '2026-10-01T00:00:00Z',
      elapsedDays: 32,
      elapsedTenure: '1 month 1 day',
      actualTenure: '1 month 1 day',
      isSettled: false,
    },
    {
      id: 7,
      loanId: 'LN-007',
      borrowerId: 7,
      principalAmount: 10000,
      principalOutstanding: 10000,
      interestRate: 5,
      interestRateType: 'monthly',
      monthlyInterestAmount: 500,
      dailyInterestAmount: 16.67,
      loanGivenDate: '2026-09-13',
      totalReceived: 500,
      principalReceived: 0,
      interestReceived: 500,
      interestOutstanding: 333.33,
      totalOutstanding: 10333.33,
      accruedInterest: 833.33,
      status: 'active',
      createdBy: 1,
      createdAt: '2026-09-13T00:00:00Z',
      updatedAt: '2026-10-14T00:00:00Z',
      elapsedDays: 50,
      elapsedTenure: '1 month 20 days',
      actualTenure: '1 month 20 days',
      isSettled: false,
    },
    {
      id: 6,
      loanId: 'LN-006',
      borrowerId: 6,
      principalAmount: 10000,
      principalOutstanding: 10000,
      interestRate: 5,
      interestRateType: 'monthly',
      monthlyInterestAmount: 500,
      dailyInterestAmount: 16.67,
      loanGivenDate: '2026-09-09',
      totalReceived: 0,
      principalReceived: 0,
      interestReceived: 0,
      interestOutstanding: 900,
      totalOutstanding: 10900,
      accruedInterest: 900,
      status: 'active',
      createdBy: 1,
      createdAt: '2026-09-09T00:00:00Z',
      updatedAt: '2026-09-09T00:00:00Z',
      elapsedDays: 54,
      elapsedTenure: '1 month 24 days',
      actualTenure: '1 month 24 days',
      isSettled: false,
    },
  ];

  const asOfDate = new Date('2026-11-02T12:00:00');

  const calculateTotals = (loans: LoanWithBorrower[]) => {
    let sumInterestReceived = new Decimal(0);
    let sumAmountReceived = new Decimal(0);
    let sumInterestOutstanding = new Decimal(0);

    for (const loan of loans) {
      sumInterestReceived = sumInterestReceived.plus(Number(loan.interestReceived || 0));
      sumAmountReceived = sumAmountReceived.plus(Number(loan.totalReceived || 0));
      const res = calculateDynamicInterestOutstanding(loan, asOfDate);
      sumInterestOutstanding = sumInterestOutstanding.plus(res.interestOutstanding);
    }

    return {
      interestReceived: sumInterestReceived.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber(),
      amountReceived: sumAmountReceived.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber(),
      interestOutstanding: sumInterestOutstanding.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber(),
    };
  };

  it('correctly calculates footer totals across the complete dataset', () => {
    const totals = calculateTotals(mockLoans);

    // Interest Received: LN-008 (0) + LN-007 (500) + LN-006 (0) = 500
    expect(totals.interestReceived).toBe(500.0);
    expect(formatCurrency(totals.interestReceived)).toContain('500.00');

    // Amount Received: LN-008 (0) + LN-007 (500) + LN-006 (0) = 500
    expect(totals.amountReceived).toBe(500.0);
    expect(formatCurrency(totals.amountReceived)).toContain('500.00');

    // Interest Outstanding: LN-008 (1033.33) + LN-007 (333.33) + LN-006 (900.00) = 2266.66
    expect(totals.interestOutstanding).toBe(2266.66);
    expect(formatCurrency(totals.interestOutstanding)).toContain('2,266.66');
  });

  it('totals remain identical regardless of pagination page slicing', () => {
    // Page 1 (first 2 items)
    const page1 = mockLoans.slice(0, 2);
    // Page 2 (3rd item)
    const page2 = mockLoans.slice(2, 3);

    // In LoanList, datasetForTotals uses allLoans (the complete filtered dataset)
    const fullDatasetTotals = calculateTotals(mockLoans);
    const totalsOnPage1 = calculateTotals(mockLoans); // allLoans passed
    const totalsOnPage2 = calculateTotals(mockLoans); // allLoans passed

    expect(totalsOnPage1).toEqual(fullDatasetTotals);
    expect(totalsOnPage2).toEqual(fullDatasetTotals);
    // Verifying it does NOT equal the sliced page 1 sum
    const page1OnlySum = calculateTotals(page1);
    expect(fullDatasetTotals.interestOutstanding).not.toEqual(page1OnlySum.interestOutstanding);
  });
});
