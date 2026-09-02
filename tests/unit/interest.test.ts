import { describe, it, expect } from 'vitest';
import {
  calculatePeriodicAccrual,
  calculateMonthlyInterest,
  calculateDailyInterest,
  calculateCalendarTenure,
} from '../../netlify/functions/_lib/repositories/loan.repository';

describe('Interest Calculations Unit Tests', () => {
  describe('calculateCalendarTenure', () => {
    it('should calculate 0 days for same date', () => {
      const res = calculateCalendarTenure('2026-01-01', '2026-01-01');
      expect(res.years).toBe(0);
      expect(res.months).toBe(0);
      expect(res.days).toBe(0);
      expect(res.totalDays).toBe(0);
    });

    it('should calculate exact 1 month', () => {
      const res = calculateCalendarTenure('2026-01-01', '2026-02-01');
      expect(res.months).toBe(1);
      expect(res.days).toBe(0);
    });

    it('should calculate 1 month and 29 days correctly', () => {
      const res = calculateCalendarTenure('2026-07-04', '2026-09-02');
      expect(res.months).toBe(1);
      expect(res.days).toBe(29);
      expect(res.formatted).toBe('1 month 29 days');
    });

    it('should handle multi-year differences', () => {
      const res = calculateCalendarTenure('2024-01-01', '2026-03-15');
      expect(res.years).toBe(2);
      expect(res.months).toBe(2);
      expect(res.days).toBe(14);
    });
  });

  describe('Monthly Interest (Market-Style: Completed Month + Pro-rata Daily / 30)', () => {
    it('should calculate 0 interest for 0 days', () => {
      const int = calculatePeriodicAccrual(10000, 3, 'monthly', '2026-01-01', '2026-01-01');
      expect(int).toBe(0);
    });

    it('should calculate exactly 1 month interest', () => {
      // 10000 * 3% = 300
      const int = calculatePeriodicAccrual(10000, 3, 'monthly', '2026-01-01', '2026-02-01');
      expect(int).toBe(300);
    });

    it('should calculate 1 month + 1 day interest', () => {
      // 300 (1 mo) + (300/30 * 1) = 310
      const int = calculatePeriodicAccrual(10000, 3, 'monthly', '2026-01-01', '2026-02-02');
      expect(int).toBe(310);
    });

    it('should calculate 1 month + 29 days interest (Example 1: ₹10k @ 3%)', () => {
      // 300 (1 mo) + (10 * 29) = 590
      const _int = calculatePeriodicAccrual(10000, 3, 'monthly', '2026-01-01', '2026-03-01');
      // 2026-01-01 to 2026-03-01 is 2 months 0 days in non-leap year (Jan has 31d, Feb has 28d)
      // For exact 1 month 29 days:
      const int2 = calculatePeriodicAccrual(10000, 3, 'monthly', '2026-07-04', '2026-09-02');
      expect(int2).toBe(590);
    });

    it('should calculate exactly 2 months interest', () => {
      const int = calculatePeriodicAccrual(10000, 3, 'monthly', '2026-01-01', '2026-03-01');
      expect(int).toBe(600);
    });

    it('should calculate LN-010 specification (₹10k @ 10% monthly, 1 mo 29 d)', () => {
      // Monthly int: 1000, Daily int: 33.3333333333
      // 1 mo = 1000, 29 d = 966.67 -> Total = 1966.67
      const int = calculatePeriodicAccrual(10000, 10, 'monthly', '2026-07-04', '2026-09-02');
      expect(int).toBe(1966.67);
    });
  });

  describe('Flat and Daily Interest', () => {
    it('should compute flat interest without time multiplication', () => {
      const int = calculatePeriodicAccrual(10000, 5, 'flat', '2026-01-01', '2026-12-31');
      expect(int).toBe(500);
    });

    it('should compute daily interest strictly per day', () => {
      // 10000 @ 3% daily equivalent = 10/day * 15 days = 150
      const int = calculatePeriodicAccrual(10000, 3, 'daily', '2026-01-01', '2026-01-16');
      expect(int).toBe(150);
    });
  });

  describe('Edge Cases & Zero Handling', () => {
    it('should return 0 when principal is 0', () => {
      expect(calculatePeriodicAccrual(0, 5, 'monthly', '2026-01-01', '2026-02-01')).toBe(0);
      expect(calculateMonthlyInterest(0, 5, 'monthly')).toBe(0);
      expect(calculateDailyInterest(0, 5, 'monthly')).toBe(0);
    });

    it('should return 0 when rate is 0', () => {
      expect(calculatePeriodicAccrual(10000, 0, 'monthly', '2026-01-01', '2026-02-01')).toBe(0);
      expect(calculateMonthlyInterest(10000, 0, 'monthly')).toBe(0);
      expect(calculateDailyInterest(10000, 0, 'monthly')).toBe(0);
    });

    it('should handle large amounts accurately', () => {
      // 10,000,000 @ 1.5% monthly = 150,000/mo
      const int = calculatePeriodicAccrual(10000000, 1.5, 'monthly', '2026-01-01', '2026-02-01');
      expect(int).toBe(150000);
    });
  });
});
