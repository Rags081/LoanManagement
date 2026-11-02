import { describe, it, expect } from 'vitest';
import {
  calculateDynamicInterestOutstanding,
  DAILY_INTEREST_DIVISOR,
} from '../../src/utils/interestCalculation';
import { getLoanDayOfMonth } from '../../src/utils/date';
import { LoanWithBorrower } from '../../src/types/loan';

describe('Dynamic Interest Outstanding Calculation & Elapsed Duration', () => {
  it('correctly calculates LN-008: ₹1,000.00 + ₹33.33 (1m 1d elapsed, Red)', () => {
    const loanLN008: LoanWithBorrower = {
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
    };

    const asOfDate = new Date('2026-11-02T12:00:00');
    const result = calculateDynamicInterestOutstanding(loanLN008, asOfDate);

    expect(result.principal).toBe(20000);
    expect(result.monthlyRate).toBe(5);
    expect(result.monthlyInterest).toBe(1000);
    expect(result.completedMonths).toBe(1);
    expect(result.remainingDays).toBe(1);
    expect(result.totalAccruedInterest).toBe(1033.33);
    expect(result.interestPaid).toBe(0);
    expect(result.interestOutstanding).toBe(1033.33);
    expect(result.previousMonthsOutstanding).toBe(1000);
    expect(result.currentMonthOutstanding).toBe(33.33);
    expect(result.previousMonthsOutstanding + result.currentMonthOutstanding).toBe(result.interestOutstanding);
    expect(result.breakdownText).toContain('1,000.00');
    expect(result.breakdownText).toContain('+');
    expect(result.breakdownText).toContain('33.33');
    expect(result.unpaidElapsedDurationText).toBe('1m 1d elapsed');
    expect(result.isDurationOverOneMonth).toBe(true); // Red (> 1 month)
  });

  it('correctly calculates LN-003: ₹333.33 (0m 20d elapsed, Black) excluding 2 settled months', () => {
    // LN-003: Disbursed 2026-08-13, ₹1,000 interest received (2 full months paid @ ₹500/mo)
    // As of 2026-11-02, calendar tenure is 2m 20d.
    // 2 completed months are fully settled.
    // Unpaid period starts at 2026-10-13 -> 0m 20d elapsed.
    const loanLN003: LoanWithBorrower = {
      id: 3,
      loanId: 'LN-003',
      borrowerId: 3,
      principalAmount: 10000,
      principalOutstanding: 10000,
      interestRate: 5,
      interestRateType: 'monthly',
      monthlyInterestAmount: 500,
      dailyInterestAmount: 16.67,
      loanGivenDate: '2026-08-13',
      totalReceived: 1000,
      principalReceived: 0,
      interestReceived: 1000,
      interestOutstanding: 333.33,
      totalOutstanding: 10333.33,
      accruedInterest: 1333.33,
      status: 'active',
      createdBy: 1,
      createdAt: '2026-08-13T00:00:00Z',
      updatedAt: '2026-10-13T00:00:00Z',
      elapsedDays: 81,
      elapsedTenure: '2 months 20 days',
      actualTenure: '2 months 20 days',
      isSettled: false,
    };

    const asOfDate = new Date('2026-11-02T12:00:00');
    const result = calculateDynamicInterestOutstanding(loanLN003, asOfDate);

    expect(result.principal).toBe(10000);
    expect(result.monthlyInterest).toBe(500);
    expect(result.totalAccruedInterest).toBe(1333.33);
    expect(result.interestPaid).toBe(1000);
    expect(result.interestOutstanding).toBe(333.33);
    // 2 completed months are paid, so ₹0 previous months and ₹333.33 current partial month
    expect(result.previousMonthsOutstanding).toBe(0);
    expect(result.currentMonthOutstanding).toBe(333.33);
    expect(result.breakdownText).toContain('333.33');
    expect(result.breakdownText).not.toContain('+');
    // Elapsed duration must be measured from oldest UNPAID period: 2026-10-13 -> 0m 20d
    expect(result.unpaidCompletedMonths).toBe(0);
    expect(result.unpaidDays).toBe(20);
    expect(result.unpaidElapsedDurationText).toBe('0m 20d elapsed');
    expect(result.isDurationOverOneMonth).toBe(false); // Black (<= 1 month)
  });

  it('correctly calculates LN-006: ₹500.00 + ₹400.00 (1m 24d elapsed, Red)', () => {
    const loanLN006: LoanWithBorrower = {
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
    };

    const asOfDate = new Date('2026-11-02T12:00:00');
    const result = calculateDynamicInterestOutstanding(loanLN006, asOfDate);

    expect(result.principal).toBe(10000);
    expect(result.monthlyInterest).toBe(500);
    expect(result.completedMonths).toBe(1);
    expect(result.remainingDays).toBe(24);
    // 500 + (16.6667 * 24) = 500 + 400 = 900
    expect(result.totalAccruedInterest).toBe(900.0);
    expect(result.interestPaid).toBe(0);
    expect(result.interestOutstanding).toBe(900.0);
    expect(result.previousMonthsOutstanding).toBe(500);
    expect(result.currentMonthOutstanding).toBe(400);
    expect(result.previousMonthsOutstanding + result.currentMonthOutstanding).toBe(result.interestOutstanding);
    expect(result.breakdownText).toContain('500.00');
    expect(result.breakdownText).toContain('+');
    expect(result.breakdownText).toContain('400.00');
    expect(result.unpaidElapsedDurationText).toBe('1m 24d elapsed');
    expect(result.isDurationOverOneMonth).toBe(true); // Red (> 1 month)
  });

  it('does NOT exclude a month for partial interest payment', () => {
    // 2 months 20 days accrued (e.g. ₹500 + ₹500 + ₹333.33).
    // Suppose borrower paid ₹750:
    // Month 1 (₹500) is settled.
    // Month 2 (₹500) has ₹250 paid, so it is NOT completely settled.
    // Oldest unpaid period start date is start of Month 2 (2026-09-13).
    // From 2026-09-13 to 2026-11-02 is 1m 20d elapsed!
    const loanPartial: LoanWithBorrower = {
      id: 301,
      loanId: 'LN-PARTIAL',
      borrowerId: 3,
      principalAmount: 10000,
      principalOutstanding: 10000,
      interestRate: 5,
      interestRateType: 'monthly',
      monthlyInterestAmount: 500,
      dailyInterestAmount: 16.67,
      loanGivenDate: '2026-08-13',
      totalReceived: 750,
      principalReceived: 0,
      interestReceived: 750,
      interestOutstanding: 583.33,
      totalOutstanding: 10583.33,
      accruedInterest: 1333.33,
      status: 'active',
      createdBy: 1,
      createdAt: '2026-08-13T00:00:00Z',
      updatedAt: '2026-10-13T00:00:00Z',
      elapsedDays: 81,
      elapsedTenure: '2 months 20 days',
      actualTenure: '2 months 20 days',
      isSettled: false,
    };

    const asOfDate = new Date('2026-11-02T12:00:00');
    const result = calculateDynamicInterestOutstanding(loanPartial, asOfDate);

    // Month 2 is NOT completely settled, so unpaid duration starts at Month 2 (1m 20d)
    expect(result.unpaidCompletedMonths).toBe(1);
    expect(result.unpaidDays).toBe(20);
    expect(result.unpaidElapsedDurationText).toBe('1m 20d elapsed');
    expect(result.isDurationOverOneMonth).toBe(true);
  });

  it('determines text color as Black for duration <= 1 month (e.g. exactly 1 month or 10 days)', () => {
    // Exactly 1 month
    const exactOneMonthLoan: LoanWithBorrower = {
      id: 201,
      loanId: 'LN-1M',
      borrowerId: 1,
      principalAmount: 10000,
      principalOutstanding: 10000,
      interestRate: 5,
      interestRateType: 'monthly',
      monthlyInterestAmount: 500,
      dailyInterestAmount: 16.67,
      loanGivenDate: '2026-10-02',
      totalReceived: 0,
      principalReceived: 0,
      interestReceived: 0,
      interestOutstanding: 500,
      totalOutstanding: 10500,
      accruedInterest: 500,
      status: 'active',
      createdBy: 1,
      createdAt: '2026-10-02T00:00:00Z',
      updatedAt: '2026-10-02T00:00:00Z',
      elapsedDays: 31,
      elapsedTenure: '1 month',
      actualTenure: '1 month',
      isSettled: false,
    };
    const asOfDate = new Date('2026-11-02T12:00:00');
    const resultExact = calculateDynamicInterestOutstanding(exactOneMonthLoan, asOfDate);
    expect(resultExact.completedMonths).toBe(1);
    expect(resultExact.remainingDays).toBe(0);
    expect(resultExact.unpaidElapsedDurationText).toBe('1m 0d elapsed');
    expect(resultExact.isDurationOverOneMonth).toBe(false); // Exactly 1 month -> Black!

    // 10 days
    const tenDaysLoan: LoanWithBorrower = {
      ...exactOneMonthLoan,
      id: 202,
      loanId: 'LN-10D',
      loanGivenDate: '2026-10-23',
    };
    const resultTen = calculateDynamicInterestOutstanding(tenDaysLoan, asOfDate);
    expect(resultTen.completedMonths).toBe(0);
    expect(resultTen.remainingDays).toBe(10);
    expect(resultTen.unpaidElapsedDurationText).toBe('0m 10d elapsed');
    expect(resultTen.isDurationOverOneMonth).toBe(false); // 10 days -> Black!
  });

  it('displays ₹0.00 for settled or completed loans and marks isSettled true', () => {
    const completedLoan: LoanWithBorrower = {
      id: 99,
      loanId: 'LN-COMP',
      borrowerId: 1,
      principalAmount: 10000,
      principalOutstanding: 0,
      interestRate: 5,
      interestRateType: 'monthly',
      monthlyInterestAmount: 500,
      dailyInterestAmount: 16.67,
      loanGivenDate: '2026-01-01',
      totalReceived: 10500,
      principalReceived: 10000,
      interestReceived: 500,
      interestOutstanding: 0,
      totalOutstanding: 0,
      accruedInterest: 500,
      status: 'completed',
      createdBy: 1,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-02-01T00:00:00Z',
      elapsedDays: 31,
      elapsedTenure: '1 month',
      actualTenure: '1 month',
      isSettled: true,
    };

    const asOfDate = new Date('2026-11-02T12:00:00');
    const result = calculateDynamicInterestOutstanding(completedLoan, asOfDate);

    expect(result.interestOutstanding).toBe(0);
    expect(result.isSettled).toBe(true);
    expect(result.isDurationOverOneMonth).toBe(false);
  });

  it('uses configurable DAILY_INTEREST_DIVISOR = 30', () => {
    expect(DAILY_INTEREST_DIVISOR).toBe(30);
  });
});

describe('getLoanDayOfMonth Helper', () => {
  it('extracts 2-digit day without UTC or timezone shifts', () => {
    expect(getLoanDayOfMonth('2026-09-02')).toBe('02');
    expect(getLoanDayOfMonth('2026-10-01T00:00:00.000Z')).toBe('01');
    expect(getLoanDayOfMonth('2026-08-13')).toBe('13');
    expect(getLoanDayOfMonth('2026-01-31')).toBe('31');
    expect(getLoanDayOfMonth(null)).toBeNull();
    expect(getLoanDayOfMonth(undefined)).toBeNull();
  });
});

