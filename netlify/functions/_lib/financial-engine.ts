import Decimal from 'decimal.js';

export interface NormalizedLoanData {
  id: number;
  loanId?: string;
  loan_id?: string;
  principalAmount?: number | string;
  principal_amount?: number | string;
  interestRate?: number | string;
  interest_rate?: number | string;
  interestRateType?: 'monthly' | 'daily' | 'flat';
  interest_rate_type?: 'monthly' | 'daily' | 'flat';
  loanGivenDate?: string | Date;
  loan_given_date?: string | Date;
  dueDate?: string | Date | null;
  due_date?: string | Date | null;
  status?: 'active' | 'overdue' | 'completed' | 'cancelled';
  settlementDate?: string | Date | null;
  settlement_date?: string | Date | null;
  total_expected_interest?: number | string;
}

export interface NormalizedPaymentData {
  id?: number;
  paymentAmount?: number | string;
  payment_amount?: number | string;
  principalPortion?: number | string;
  principal_portion?: number | string;
  interestPortion?: number | string;
  interest_portion?: number | string;
  paymentDate?: string | Date;
  payment_date?: string | Date;
  isVoid?: boolean | number;
  is_void?: boolean | number;
}

export interface CalculatedOutstandingResult {
  principalAmount: number;
  principalReceived: number;
  principalOutstanding: number;
  interestExpected: number;
  accruedInterest: number;
  interestReceived: number;
  interestOutstanding: number;
  totalExpected: number;
  totalReceived: number;
  totalOutstanding: number;
  isOverdue: boolean;
  daysOverdue: number;
  elapsedDays: number;
  elapsedTenure: string;
  actualTenure: string;
  settlementDate?: string | null;
  isCompleted: boolean;
}

/**
 * Converts Date or date string to local YYYY-MM-DD string without UTC shift
 */
export function toLocalDateString(d: Date | string | null | undefined): string {
  if (!d) return '';
  if (typeof d === 'string') {
    return d.split('T')[0].split(' ')[0];
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Accurately calculates calendar difference in years, months, and days between two dates.
 * Uses exact calendar month/day borrow arithmetic (e.g. 10 Jan 2026 -> 2 Sep 2026 = "7 months 23 days").
 */
export function calculateCalendarTenure(
  startDateStr: string | Date | null | undefined,
  endDateStr: string | Date | null | undefined = new Date()
): {
  years: number;
  months: number;
  days: number;
  totalDays: number;
  formatted: string;
} {
  if (!startDateStr) {
    return { years: 0, months: 0, days: 0, totalDays: 0, formatted: '0 days' };
  }

  const startClean = toLocalDateString(startDateStr);
  const endClean = endDateStr ? toLocalDateString(endDateStr) : toLocalDateString(new Date());

  const [y1, m1, d1] = startClean.split('-').map(Number);
  const [y2, m2, d2] = endClean.split('-').map(Number);

  const start = new Date(y1, m1 - 1, d1, 12, 0, 0);
  const end = new Date(y2, m2 - 1, d2, 12, 0, 0);

  if (end < start) {
    return { years: 0, months: 0, days: 0, totalDays: 0, formatted: '0 days' };
  }

  let years = y2 - y1;
  let months = (m2 - 1) - (m1 - 1);
  let days = d2 - d1;

  if (days < 0) {
    const prevMonthLastDay = new Date(y2, m2 - 1, 0).getDate();
    days += prevMonthLastDay;
    months -= 1;
  }

  if (months < 0) {
    months += 12;
    years -= 1;
  }

  const diffMs = end.getTime() - start.getTime();
  const totalDays = Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));

  const parts: string[] = [];
  if (years > 0) {
    parts.push(`${years} year${years === 1 ? '' : 's'}`);
  }
  if (months > 0) {
    parts.push(`${months} month${months === 1 ? '' : 's'}`);
  }
  if (days > 0 || parts.length === 0) {
    parts.push(`${days} day${days === 1 ? '' : 's'}`);
  }

  return {
    years,
    months,
    days,
    totalDays,
    formatted: parts.join(' '),
  };
}

/**
 * Isolated interest accrual calculation for any active principal balance across a calendar window.
 * - Monthly Standard: Charged for full month (any fractional days in a month count as a full month).
 * - Daily: Pro-rated strictly per day.
 */
export function calculatePeriodicAccrual(
  activePrincipal: number,
  rate: number,
  rateType: 'monthly' | 'daily' | 'flat' = 'monthly',
  startDateStr: string | Date,
  endDateStr: string | Date
): number {
  if (activePrincipal <= 0 || rate <= 0) return 0;

  Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });
  const p = new Decimal(activePrincipal);
  const r = new Decimal(rate).dividedBy(100);

  const tenure = calculateCalendarTenure(startDateStr, endDateStr);

  if (rateType === 'daily') {
    const dailyRate = r.dividedBy(30);
    return p.times(dailyRate).times(tenure.totalDays).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber();
  }

  if (rateType === 'flat') {
    return p.times(r).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber();
  }

  // Monthly Market-Style: Completed Month Interest + Partial Month Daily Interest (÷ 30)
  const completedMonths = tenure.years * 12 + tenure.months;
  const remainingDays = tenure.days;
  const monthlyInterest = p.times(r);
  const dailyInterest = monthlyInterest.dividedBy(30);

  const total = monthlyInterest.times(completedMonths).plus(dailyInterest.times(remainingDays));
  return total.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber();
}

/**
 * Calculates monthly interest amount in ₹ based on active principal
 */
export function calculateMonthlyInterest(
  principal: number,
  rate: number,
  rateType: 'monthly' | 'daily' | 'flat' = 'monthly'
): number {
  if (principal <= 0 || rate <= 0) return 0;
  Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });
  const p = new Decimal(principal);
  const r = new Decimal(rate).dividedBy(100);
  if (rateType === 'daily') {
    return p.times(r.dividedBy(30)).times(30).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber();
  }
  return p.times(r).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber();
}

/**
 * Calculates daily interest amount in ₹
 */
export function calculateDailyInterest(
  principal: number,
  rate: number,
  rateType: 'monthly' | 'daily' | 'flat' = 'monthly'
): number {
  if (principal <= 0 || rate <= 0) return 0;
  Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });
  const monthly = new Decimal(calculateMonthlyInterest(principal, rate, rateType));
  return monthly.dividedBy(30).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber();
}

/**
 * Pure financial calculation engine that consumes normalized loan and payment data
 * and computes exact ledger balances, interest accruals, and status flags.
 */
export function calculateLoanFinancials(
  loan: NormalizedLoanData,
  rawPayments: NormalizedPaymentData[],
  asOfDate: Date | string = new Date()
): CalculatedOutstandingResult {
  Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

  const originalPrincipal = Number(loan.principalAmount ?? loan.principal_amount ?? 0);
  const rate = Number(loan.interestRate ?? loan.interest_rate ?? 0);
  const rateType = loan.interestRateType ?? loan.interest_rate_type ?? 'monthly';
  const loanGivenDateStr = toLocalDateString(loan.loanGivenDate ?? loan.loan_given_date);

  // Filter out void payments and sort chronologically
  const payments = rawPayments
    .filter((p) => !p.isVoid && !p.is_void)
    .sort((a, b) => {
      const dateA = toLocalDateString(a.paymentDate ?? a.payment_date);
      const dateB = toLocalDateString(b.paymentDate ?? b.payment_date);
      if (dateA !== dateB) return dateA.localeCompare(dateB);
      return (Number(a.id || 0) - Number(b.id || 0));
    });

  let totalPrincipalPaid = 0;
  let totalInterestPaid = 0;
  let totalReceived = 0;
  let settlementPaymentDate: string | null = null;

  for (const p of payments) {
    const pAmount = Number(p.paymentAmount ?? p.payment_amount ?? 0);
    const pPrincipal = Number(p.principalPortion ?? p.principal_portion ?? 0);
    const pInterest = Number(p.interestPortion ?? p.interest_portion ?? 0);
    const pDate = toLocalDateString(p.paymentDate ?? p.payment_date);

    totalPrincipalPaid += pPrincipal;
    totalInterestPaid += pInterest;
    totalReceived += pAmount;

    if (originalPrincipal - totalPrincipalPaid <= 0) {
      settlementPaymentDate = pDate;
    }
  }

  const todayStr = toLocalDateString(asOfDate);
  const activePrincipal = Math.max(0, originalPrincipal - totalPrincipalPaid);

  const isAlreadySettled = loan.status === 'completed' || (activePrincipal === 0 && totalInterestPaid > 0);
  const rawSettlement = loan.settlementDate ?? loan.settlement_date;
  const settlementDate = rawSettlement
    ? toLocalDateString(rawSettlement)
    : isAlreadySettled
    ? (settlementPaymentDate || todayStr)
    : null;

  const endDateStr = isAlreadySettled && settlementDate ? settlementDate : todayStr;

  const tenureResult = calculateCalendarTenure(loanGivenDateStr, endDateStr);
  const elapsedDays = tenureResult.totalDays;
  const elapsedTenure = tenureResult.formatted;

  let totalAccruedInterest = 0;

  if (rateType === 'flat') {
    totalAccruedInterest = new Decimal(originalPrincipal)
      .times(new Decimal(rate).dividedBy(100))
      .toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
      .toNumber();
  } else if (rateType === 'daily') {
    let curPrincipal = originalPrincipal;
    let lastDate = loanGivenDateStr;
    let dailySum = 0;

    for (const p of payments) {
      const pDate = toLocalDateString(p.paymentDate ?? p.payment_date);
      const diffDays = Math.max(0, Math.round((new Date(pDate).getTime() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24)));
      const dailyRate = (rate / 100) / 30;
      dailySum += curPrincipal * dailyRate * diffDays;
      curPrincipal = Math.max(0, curPrincipal - Number(p.principalPortion ?? p.principal_portion ?? 0));
      lastDate = pDate;
    }

    const diffFinal = Math.max(0, Math.round((new Date(endDateStr).getTime() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24)));
    const dailyRate = (rate / 100) / 30;
    dailySum += curPrincipal * dailyRate * diffFinal;
    totalAccruedInterest = Math.round(dailySum * 100) / 100;
  } else {
    // Monthly Market-Style: Completed Month Interest + Partial Month Daily Interest (÷ 30)
    // Calculated dynamically across reducing principal segments
    let curPrincipal = originalPrincipal;
    let lastDate = loanGivenDateStr;
    let totalInterestAccruedDec = new Decimal(0);
    const monthlyRate = new Decimal(rate).dividedBy(100);

    for (const p of payments) {
      const pDate = toLocalDateString(p.paymentDate ?? p.payment_date);
      const pPrinc = Number(p.principalPortion ?? p.principal_portion ?? 0);

      if (pPrinc > 0 && pDate > lastDate && curPrincipal > 0) {
        const segTenure = calculateCalendarTenure(lastDate, pDate);
        const completedMonths = segTenure.years * 12 + segTenure.months;
        const remainingDays = segTenure.days;

        const pMonthlyInt = new Decimal(curPrincipal).times(monthlyRate);
        const pDailyInt = pMonthlyInt.dividedBy(30);

        const segInterest = pMonthlyInt.times(completedMonths).plus(pDailyInt.times(remainingDays));
        totalInterestAccruedDec = totalInterestAccruedDec.plus(segInterest);

        lastDate = pDate;
      }

      if (pPrinc > 0) {
        curPrincipal = Math.max(0, curPrincipal - pPrinc);
        if (pDate > lastDate) {
          lastDate = pDate;
        }
      }
    }

    // Final segment: from lastDate up to endDateStr on remaining active principal
    if (endDateStr > lastDate && curPrincipal > 0) {
      const finalTenure = calculateCalendarTenure(lastDate, endDateStr);
      const completedMonths = finalTenure.years * 12 + finalTenure.months;
      const remainingDays = finalTenure.days;

      const pMonthlyInt = new Decimal(curPrincipal).times(monthlyRate);
      const pDailyInt = pMonthlyInt.dividedBy(30);

      const finalInterest = pMonthlyInt.times(completedMonths).plus(pDailyInt.times(remainingDays));
      totalInterestAccruedDec = totalInterestAccruedDec.plus(finalInterest);
    } else if (lastDate === loanGivenDateStr && curPrincipal > 0) {
      // No principal payments made
      const tenure = calculateCalendarTenure(loanGivenDateStr, endDateStr);
      const completedMonths = tenure.years * 12 + tenure.months;
      const remainingDays = tenure.days;

      const pMonthlyInt = new Decimal(curPrincipal).times(monthlyRate);
      const pDailyInt = pMonthlyInt.dividedBy(30);

      totalInterestAccruedDec = pMonthlyInt.times(completedMonths).plus(pDailyInt.times(remainingDays));
    }

    totalAccruedInterest = totalInterestAccruedDec.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber();
  }

  const interestDue = Math.max(0, totalAccruedInterest - totalInterestPaid);
  const isCompleted = isAlreadySettled || (activePrincipal === 0 && interestDue === 0);

  const principalOutstanding = activePrincipal;
  const interestOutstanding = interestDue;
  const totalOutstanding = principalOutstanding + interestOutstanding;

  // Overdue logic: Only if explicit due_date exists and was passed
  const rawDueDate = loan.dueDate ?? loan.due_date;
  const dueDateStr = rawDueDate ? toLocalDateString(rawDueDate) : null;
  const isOverdue = !!dueDateStr && todayStr > dueDateStr && totalOutstanding > 0;
  let daysOverdue = 0;
  if (isOverdue && dueDateStr) {
    const dueTime = new Date(dueDateStr).getTime();
    const todayTime = new Date(todayStr).getTime();
    daysOverdue = Math.max(0, Math.floor((todayTime - dueTime) / (1000 * 60 * 60 * 24)));
  }

  const effectiveExpectedInterest = Math.max(totalAccruedInterest, totalInterestPaid);

  return {
    principalAmount: originalPrincipal,
    principalReceived: totalPrincipalPaid,
    principalOutstanding,
    interestExpected: effectiveExpectedInterest,
    accruedInterest: totalAccruedInterest,
    interestReceived: totalInterestPaid,
    interestOutstanding,
    totalExpected: originalPrincipal + effectiveExpectedInterest,
    totalReceived,
    totalOutstanding,
    isOverdue,
    daysOverdue,
    elapsedDays,
    elapsedTenure,
    actualTenure: elapsedTenure,
    settlementDate,
    isCompleted,
  };
}
