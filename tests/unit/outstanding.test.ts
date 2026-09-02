import { describe, it, expect } from 'vitest';
import Decimal from 'decimal.js';
import { calculateCalendarTenure } from '../../netlify/functions/_lib/repositories/loan.repository';

describe('Outstanding Balance Calculation Unit Tests', () => {
  // Pure algorithm simulation of loanRepository.calculateOutstanding reducing-balance calculation
  function calculateLoanOutstandingSimulation(params: {
    originalPrincipal: number;
    rate: number;
    rateType: 'monthly' | 'daily' | 'flat';
    loanGivenDate: string;
    endDate: string;
    payments: Array<{
      paymentDate: string;
      principalPortion: number;
      interestPortion: number;
      isVoid?: boolean;
    }>;
  }) {
    Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });
    const { originalPrincipal, rate, rateType, loanGivenDate, endDate, payments } = params;

    const validPayments = payments.filter((p) => !p.isVoid);
    let totalPrincipalPaid = 0;
    let totalInterestPaid = 0;
    let _totalReceived = 0;

    for (const p of validPayments) {
      totalPrincipalPaid += p.principalPortion;
      totalInterestPaid += p.interestPortion;
      _totalReceived += p.principalPortion + p.interestPortion;
    }

    const activePrincipal = Math.max(0, originalPrincipal - totalPrincipalPaid);
    let totalAccruedInterest = 0;

    if (rateType === 'flat') {
      totalAccruedInterest = new Decimal(originalPrincipal)
        .times(new Decimal(rate).dividedBy(100))
        .toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
        .toNumber();
    } else if (rateType === 'daily') {
      let curPrincipal = originalPrincipal;
      let lastDate = loanGivenDate;
      let dailySum = 0;
      const dailyRate = (rate / 100) / 30;

      for (const p of validPayments) {
        if (p.paymentDate > lastDate) {
          const diffMs = new Date(p.paymentDate).getTime() - new Date(lastDate).getTime();
          const diffDays = Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));
          dailySum += curPrincipal * dailyRate * diffDays;
          lastDate = p.paymentDate;
        }
        curPrincipal = Math.max(0, curPrincipal - p.principalPortion);
      }

      if (endDate > lastDate && curPrincipal > 0) {
        const diffMs = new Date(endDate).getTime() - new Date(lastDate).getTime();
        const diffDays = Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));
        dailySum += curPrincipal * dailyRate * diffDays;
      }
      totalAccruedInterest = Math.round(dailySum * 100) / 100;
    } else {
      // Monthly Market-Style: Completed Month + Pro-rata Daily / 30
      let curPrincipal = originalPrincipal;
      let lastDate = loanGivenDate;
      let totalInterestAccruedDec = new Decimal(0);
      const monthlyRate = new Decimal(rate).dividedBy(100);

      for (const p of validPayments) {
        if (p.principalPortion > 0 && p.paymentDate > lastDate && curPrincipal > 0) {
          const segTenure = calculateCalendarTenure(lastDate, p.paymentDate);
          const completedMonths = segTenure.years * 12 + segTenure.months;
          const remainingDays = segTenure.days;

          const pMonthlyInt = new Decimal(curPrincipal).times(monthlyRate);
          const pDailyInt = pMonthlyInt.dividedBy(30);

          const segInterest = pMonthlyInt.times(completedMonths).plus(pDailyInt.times(remainingDays));
          totalInterestAccruedDec = totalInterestAccruedDec.plus(segInterest);

          lastDate = p.paymentDate;
        }

        if (p.principalPortion > 0) {
          curPrincipal = Math.max(0, curPrincipal - p.principalPortion);
          if (p.paymentDate > lastDate) {
            lastDate = p.paymentDate;
          }
        }
      }

      if (endDate > lastDate && curPrincipal > 0) {
        const finalTenure = calculateCalendarTenure(lastDate, endDate);
        const completedMonths = finalTenure.years * 12 + finalTenure.months;
        const remainingDays = finalTenure.days;

        const pMonthlyInt = new Decimal(curPrincipal).times(monthlyRate);
        const pDailyInt = pMonthlyInt.dividedBy(30);

        const finalInterest = pMonthlyInt.times(completedMonths).plus(pDailyInt.times(remainingDays));
        totalInterestAccruedDec = totalInterestAccruedDec.plus(finalInterest);
      } else if (lastDate === loanGivenDate && curPrincipal > 0) {
        const tenure = calculateCalendarTenure(loanGivenDate, endDate);
        const completedMonths = tenure.years * 12 + tenure.months;
        const remainingDays = tenure.days;

        const pMonthlyInt = new Decimal(curPrincipal).times(monthlyRate);
        const pDailyInt = pMonthlyInt.dividedBy(30);

        totalInterestAccruedDec = pMonthlyInt.times(completedMonths).plus(pDailyInt.times(remainingDays));
      }

      totalAccruedInterest = totalInterestAccruedDec.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber();
    }

    const interestDue = Math.max(0, totalAccruedInterest - totalInterestPaid);
    const effectiveExpectedInterest = Math.max(totalAccruedInterest, totalInterestPaid);

    return {
      principalOutstanding: activePrincipal,
      principalReceived: totalPrincipalPaid,
      interestExpected: effectiveExpectedInterest,
      accruedInterest: totalAccruedInterest,
      interestReceived: totalInterestPaid,
      interestOutstanding: interestDue,
      totalOutstanding: activePrincipal + interestDue,
    };
  }

  it('Scenario 1: No payment, 1 month 29 days monthly loan', () => {
    const res = calculateLoanOutstandingSimulation({
      originalPrincipal: 10000,
      rate: 3,
      rateType: 'monthly',
      loanGivenDate: '2026-07-04',
      endDate: '2026-09-02',
      payments: [],
    });

    expect(res.principalOutstanding).toBe(10000);
    expect(res.interestExpected).toBe(590);
    expect(res.interestOutstanding).toBe(590);
    expect(res.totalOutstanding).toBe(10590);
  });

  it('Scenario 2: Principal payment after 1 month reduces subsequent interest accrual', () => {
    // ₹10k @ 3% monthly. Day 30 pays ₹4,000 principal.
    const res = calculateLoanOutstandingSimulation({
      originalPrincipal: 10000,
      rate: 3,
      rateType: 'monthly',
      loanGivenDate: '2026-07-04',
      endDate: '2026-09-02', // 1 mo 29 d total
      payments: [
        {
          paymentDate: '2026-08-04', // exactly 1 month
          principalPortion: 4000,
          interestPortion: 0,
        },
      ],
    });

    // 1 mo on 10,000 = 300
    // 29 d on 6,000 = 29 * (180/30) = 174
    // Total interest = 474
    expect(res.principalOutstanding).toBe(6000);
    expect(res.principalReceived).toBe(4000);
    expect(res.interestExpected).toBe(474);
    expect(res.interestOutstanding).toBe(474);
    expect(res.totalOutstanding).toBe(6474);
  });

  it('Scenario 3: Void payment is ignored in outstanding calculation', () => {
    const res = calculateLoanOutstandingSimulation({
      originalPrincipal: 10000,
      rate: 5,
      rateType: 'flat',
      loanGivenDate: '2026-08-01',
      endDate: '2026-09-02',
      payments: [
        {
          paymentDate: '2026-08-15',
          principalPortion: 5000,
          interestPortion: 250,
          isVoid: true, // voided!
        },
      ],
    });

    expect(res.principalOutstanding).toBe(10000);
    expect(res.principalReceived).toBe(0);
    expect(res.interestReceived).toBe(0);
    expect(res.interestExpected).toBe(500);
    expect(res.totalOutstanding).toBe(10500);
  });

  it('Scenario 4: Fully settled loan returns 0 total outstanding', () => {
    const res = calculateLoanOutstandingSimulation({
      originalPrincipal: 5000,
      rate: 10,
      rateType: 'flat',
      loanGivenDate: '2026-08-01',
      endDate: '2026-09-02',
      payments: [
        {
          paymentDate: '2026-08-15',
          principalPortion: 5000,
          interestPortion: 500,
          isVoid: false,
        },
      ],
    });

    expect(res.principalOutstanding).toBe(0);
    expect(res.interestOutstanding).toBe(0);
    expect(res.totalOutstanding).toBe(0);
  });
});
