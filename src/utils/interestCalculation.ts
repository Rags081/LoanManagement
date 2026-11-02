import Decimal from 'decimal.js';
import { LoanWithBorrower } from '@/types/loan';
import { calculateCalendarTenure } from '@/utils/date';
import { formatCurrency } from './currency';

/**
 * Monthly calculation basis: 30 days per month.
 * Daily Interest = Monthly Interest / 30.
 */
export const DAILY_INTEREST_DIVISOR = 30;

/**
 * Default monthly interest rate (5%).
 */
export const DEFAULT_MONTHLY_INTEREST_RATE = 5;

export interface DynamicInterestOutstandingResult {
  principal: number;
  monthlyRate: number;
  monthlyInterest: number;
  dailyInterest: number;
  completedMonths: number;
  remainingDays: number;
  totalAccruedInterest: number;
  interestPaid: number;
  interestOutstanding: number;
  isSettled: boolean;
  // Breakdown & Duration fields
  previousMonthsOutstanding: number;
  currentMonthOutstanding: number;
  breakdownText: string;
  isDurationOverOneMonth: boolean;
  unpaidCompletedMonths: number;
  unpaidDays: number;
  unpaidElapsedDurationText: string;
}

/**
 * Dynamically calculates total outstanding interest using the business rule:
 * - Monthly Interest = Principal × 5 / 100
 * - Daily Interest = Monthly Interest / 30
 * - Total Interest Accrued = (Monthly Interest × Completed Months) + (Daily Interest × Remaining Days)
 * - Interest Outstanding = max(0, Total Interest Accrued - Interest Already Paid)
 *
 * Also computes the breakdown:
 * - Previous completed outstanding months
 * - Current month's accumulated interest
 * - Oldest unpaid period start date and elapsed duration (excluding completely settled months)
 * - Conditional text color indicator (Red if outstanding duration > 1 month, Black otherwise)
 */
export function calculateDynamicInterestOutstanding(
  loan: LoanWithBorrower,
  asOfDate: Date = new Date(),
  divisor: number = DAILY_INTEREST_DIVISOR
): DynamicInterestOutstandingResult {
  Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

  const isSettled =
    loan.status === 'completed' || loan.isSettled || loan.totalOutstanding === 0;

  const principal = Number(
    loan.principalOutstanding !== undefined
      ? loan.principalOutstanding
      : loan.principalAmount || 0
  );

  const monthlyRate = Number(loan.interestRate || DEFAULT_MONTHLY_INTEREST_RATE);

  if (isSettled || principal <= 0) {
    return {
      principal: 0,
      monthlyRate,
      monthlyInterest: 0,
      dailyInterest: 0,
      completedMonths: 0,
      remainingDays: 0,
      totalAccruedInterest: 0,
      interestPaid: Number(loan.interestReceived || 0),
      interestOutstanding: 0,
      isSettled: true,
      previousMonthsOutstanding: 0,
      currentMonthOutstanding: 0,
      breakdownText: formatCurrency(0),
      isDurationOverOneMonth: false,
      unpaidCompletedMonths: 0,
      unpaidDays: 0,
      unpaidElapsedDurationText: '0m 0d elapsed',
    };
  }

  // 1. Monthly Interest: Principal Amount × rate / 100
  const pDec = new Decimal(principal);
  const rDec = new Decimal(monthlyRate).dividedBy(100);
  const monthlyInterestDec = pDec.times(rDec);

  // 2. Daily Interest: Monthly Interest / 30
  const divisorDec = new Decimal(divisor > 0 ? divisor : DAILY_INTEREST_DIVISOR);
  const dailyInterestDec = monthlyInterestDec.dividedBy(divisorDec);

  // 3. Duration: Completed Months and Remaining Days from loan start date to current/end date
  const endDate =
    isSettled && (loan.settlementDate || loan.lastPaymentDate)
      ? (loan.settlementDate || loan.lastPaymentDate)
      : asOfDate;

  const tenure = calculateCalendarTenure(loan.loanGivenDate, endDate);
  const completedMonths = Math.max(0, tenure.years * 12 + tenure.months);
  const remainingDays = Math.max(0, tenure.days);

  // 4. Total Interest Accrued: (Monthly Interest × Completed Months) + (Daily Interest × Remaining Days)
  const monthsAccrualDec = monthlyInterestDec.times(completedMonths);
  const daysAccrualDec = dailyInterestDec.times(remainingDays);
  const totalAccruedDec = monthsAccrualDec.plus(daysAccrualDec);

  // 5. Interest Already Paid: Deduct interest payments already received (excluding principal)
  const interestPaid = Number(loan.interestReceived || 0);
  const interestPaidDec = new Decimal(interestPaid);

  // 6. Interest Outstanding: Total Accrued - Interest Already Paid
  let outstandingDec = totalAccruedDec.minus(interestPaidDec);
  if (outstandingDec.isNegative()) {
    outstandingDec = new Decimal(0);
  }

  // 7. Breakdown: Previous completed months vs current month interest
  // Payments satisfy completed months first (FIFO)
  const paidForCompletedMonthsDec = Decimal.min(interestPaidDec, monthsAccrualDec);
  const previousMonthsOutstandingDec = monthsAccrualDec.minus(paidForCompletedMonthsDec);

  // Remaining payments satisfy current partial month interest
  const remainingPaidDec = Decimal.max(0, interestPaidDec.minus(monthsAccrualDec));
  let currentMonthOutstandingDec = Decimal.max(0, daysAccrualDec.minus(remainingPaidDec));

  if (currentMonthOutstandingDec.greaterThan(outstandingDec)) {
    currentMonthOutstandingDec = outstandingDec;
  }

  // Round results consistently to 2 decimal places
  const roundedOutstanding = outstandingDec.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber();
  const roundedAccrued = totalAccruedDec.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber();
  const roundedMonthly = monthlyInterestDec.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber();
  const roundedDaily = dailyInterestDec.toDecimalPlaces(4, Decimal.ROUND_HALF_UP).toNumber();

  let roundedPrevious = previousMonthsOutstandingDec.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber();
  let roundedCurrent = currentMonthOutstandingDec.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber();

  // Rule 9: Ensure sum of displayed components exactly matches actual Interest Outstanding total
  if (roundedPrevious > 0 && roundedCurrent > 0) {
    const diff = new Decimal(roundedOutstanding).minus(roundedPrevious).minus(roundedCurrent);
    if (!diff.isZero()) {
      roundedCurrent = new Decimal(roundedOutstanding).minus(roundedPrevious).toNumber();
    }
  } else if (roundedPrevious > 0 && roundedCurrent === 0) {
    roundedPrevious = roundedOutstanding;
  } else if (roundedCurrent > 0 && roundedPrevious === 0) {
    roundedCurrent = roundedOutstanding;
  }

  // Breakdown text: "₹1,000.00 + ₹33.33" or "₹333.33"
  // Rule 6: Do not display zero-value components
  const breakdownParts: string[] = [];
  if (roundedPrevious > 0) {
    breakdownParts.push(formatCurrency(roundedPrevious));
  }
  if (roundedCurrent > 0) {
    breakdownParts.push(formatCurrency(roundedCurrent));
  }
  const breakdownText = breakdownParts.length > 0 ? breakdownParts.join(' + ') : formatCurrency(0);

  // 8. Identify completely settled interest periods and calculate unpaid elapsed duration
  // Only completely settled months are excluded from the outstanding elapsed duration.
  // A partial payment does not settle a month (oldest partially unpaid period is retained).
  const settledMonthsCount = monthlyInterestDec.greaterThan(0)
    ? Math.min(completedMonths, interestPaidDec.dividedBy(monthlyInterestDec).floor().toNumber())
    : 0;

  // Determine start date of the oldest currently unpaid interest period
  let unpaidStartDate: string | Date = loan.loanGivenDate;
  if (settledMonthsCount > 0) {
    const rawDate = loan.loanGivenDate as unknown;
    const cleanLoanDate =
      typeof rawDate === 'string'
        ? rawDate.split('T')[0].split(' ')[0]
        : rawDate instanceof Date
        ? rawDate.toISOString().split('T')[0]
        : String(rawDate || '').split('T')[0];
    const [y, m, d] = cleanLoanDate.split('-').map(Number);
    const totalTargetMonths = m - 1 + settledMonthsCount;
    const targetYear = y + Math.floor(totalTargetMonths / 12);
    const targetMonth = (totalTargetMonths % 12) + 1;
    const maxDays = new Date(targetYear, targetMonth, 0).getDate();
    const targetDay = Math.min(d, maxDays);
    unpaidStartDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}`;
  }

  const unpaidTenure = calculateCalendarTenure(unpaidStartDate, endDate);
  const unpaidCompletedMonths = Math.max(0, unpaidTenure.years * 12 + unpaidTenure.months);
  const unpaidDays = Math.max(0, unpaidTenure.days);
  const unpaidElapsedDurationText = `${unpaidCompletedMonths}m ${unpaidDays}d elapsed`;

  // Red when outstanding duration > 1 month (e.g. 1m 1d, 1m 24d, 2m+)
  // Black when outstanding duration <= 1 month (e.g. 0m 20d, 10d, exactly 1m 0d)
  const isDurationOverOneMonth =
    roundedOutstanding > 0 &&
    (unpaidCompletedMonths > 1 || (unpaidCompletedMonths === 1 && unpaidDays > 0));

  return {
    principal,
    monthlyRate,
    monthlyInterest: roundedMonthly,
    dailyInterest: roundedDaily,
    completedMonths,
    remainingDays,
    totalAccruedInterest: roundedAccrued,
    interestPaid,
    interestOutstanding: roundedOutstanding,
    isSettled: false,
    previousMonthsOutstanding: roundedPrevious,
    currentMonthOutstanding: roundedCurrent,
    breakdownText,
    isDurationOverOneMonth,
    unpaidCompletedMonths,
    unpaidDays,
    unpaidElapsedDurationText,
  };
}
