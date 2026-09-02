import { describe, it, expect } from 'vitest';
import Decimal from 'decimal.js';

describe('Payment Allocation Logic Unit Tests', () => {
  // Pure helper simulating payment allocation calculation
  function calculateAllocation(
    paymentAmountNum: number,
    principalOutstandingNum: number,
    interestOutstandingNum: number,
    method: 'interest_first' | 'principal_first' | 'proportional' = 'interest_first'
  ) {
    Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });
    const paymentAmount = new Decimal(paymentAmountNum);
    const remPrincipal = new Decimal(principalOutstandingNum);
    const remInterest = new Decimal(interestOutstandingNum);

    let principalPortion = new Decimal(0);
    let interestPortion = new Decimal(0);

    if (method === 'interest_first') {
      interestPortion = Decimal.min(paymentAmount, remInterest);
      const remainder = paymentAmount.minus(interestPortion);
      principalPortion = Decimal.min(remainder, remPrincipal);
    } else if (method === 'principal_first') {
      principalPortion = Decimal.min(paymentAmount, remPrincipal);
      const remainder = paymentAmount.minus(principalPortion);
      interestPortion = Decimal.min(remainder, remInterest);
    } else {
      const sumOutstanding = remPrincipal.plus(remInterest);
      if (sumOutstanding.isZero()) {
        principalPortion = paymentAmount;
      } else {
        const pRatio = remPrincipal.dividedBy(sumOutstanding);
        principalPortion = Decimal.min(paymentAmount.times(pRatio), remPrincipal).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
        interestPortion = paymentAmount.minus(principalPortion);
      }
    }

    return {
      principalPortion: principalPortion.toNumber(),
      interestPortion: interestPortion.toNumber(),
      remPrincipalAfter: Decimal.max(0, remPrincipal.minus(principalPortion)).toNumber(),
      remInterestAfter: Decimal.max(0, remInterest.minus(interestPortion)).toNumber(),
    };
  }

  describe('interest_first allocation', () => {
    it('should pay off interest first, then principal', () => {
      // Principal = 10000, Interest = 500, Payment = 1500
      const res = calculateAllocation(1500, 10000, 500, 'interest_first');
      expect(res.interestPortion).toBe(500);
      expect(res.principalPortion).toBe(1000);
      expect(res.remInterestAfter).toBe(0);
      expect(res.remPrincipalAfter).toBe(9000);
    });

    it('should handle partial interest payment', () => {
      // Principal = 10000, Interest = 500, Payment = 300
      const res = calculateAllocation(300, 10000, 500, 'interest_first');
      expect(res.interestPortion).toBe(300);
      expect(res.principalPortion).toBe(0);
      expect(res.remInterestAfter).toBe(200);
      expect(res.remPrincipalAfter).toBe(10000);
    });

    it('should handle full loan payoff', () => {
      // Principal = 5000, Interest = 250, Payment = 5250
      const res = calculateAllocation(5250, 5000, 250, 'interest_first');
      expect(res.interestPortion).toBe(250);
      expect(res.principalPortion).toBe(5000);
      expect(res.remInterestAfter).toBe(0);
      expect(res.remPrincipalAfter).toBe(0);
    });
  });

  describe('principal_first allocation', () => {
    it('should pay off principal first, then interest', () => {
      // Principal = 5000, Interest = 500, Payment = 5200
      const res = calculateAllocation(5200, 5000, 500, 'principal_first');
      expect(res.principalPortion).toBe(5000);
      expect(res.interestPortion).toBe(200);
      expect(res.remPrincipalAfter).toBe(0);
      expect(res.remInterestAfter).toBe(300);
    });
  });

  describe('proportional allocation', () => {
    it('should split payment proportionally to principal and interest ratio', () => {
      // Principal = 8000, Interest = 2000 (Total 10000, 80:20), Payment = 1000
      const res = calculateAllocation(1000, 8000, 2000, 'proportional');
      expect(res.principalPortion).toBe(800);
      expect(res.interestPortion).toBe(200);
      expect(res.remPrincipalAfter).toBe(7200);
      expect(res.remInterestAfter).toBe(1800);
    });
  });
});
