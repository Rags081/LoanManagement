import {
  format,
  parseISO,
  isValid,
  differenceInCalendarDays,
  addDays as dateFnsAddDays,
  addMonths as dateFnsAddMonths,
  isBefore,
  startOfDay,
} from 'date-fns';
import { DATE_FORMAT, DATE_FORMAT_DISPLAY, DATE_FORMAT_API } from './constants';

export const parseDate = (date: string | Date | null | undefined): Date | null => {
  if (!date) return null;
  if (date instanceof Date) return isValid(date) ? date : null;
  try {
    const parsed = parseISO(date);
    return isValid(parsed) ? parsed : new Date(date);
  } catch {
    return null;
  }
};

export const isValidDate = (date: string | Date | null | undefined): boolean => {
  if (!date) return false;
  const parsed = parseDate(date);
  return parsed !== null && isValid(parsed);
};

export const formatDate = (
  date: string | Date | null | undefined,
  formatPattern: string = DATE_FORMAT
): string => {
  const parsed = parseDate(date);
  if (!parsed) return '';
  return format(parsed, formatPattern);
};

export const formatDateDisplay = (date: string | Date | null | undefined): string => {
  return formatDate(date, DATE_FORMAT_DISPLAY);
};

export const formatDateAPI = (date: string | Date | null | undefined): string => {
  return formatDate(date, DATE_FORMAT_API);
};

export const getDaysBetween = (
  startDate: string | Date,
  endDate: string | Date
): number => {
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  if (!start || !end) return 0;
  return differenceInCalendarDays(end, start);
};

export const addDays = (date: string | Date, amount: number): Date => {
  const parsed = parseDate(date) || new Date();
  return dateFnsAddDays(parsed, amount);
};

export const addMonths = (date: string | Date, amount: number): Date => {
  const parsed = parseDate(date) || new Date();
  return dateFnsAddMonths(parsed, amount);
};

export const getToday = (): Date => {
  return startOfDay(new Date());
};

export const isPastDue = (dueDate: string | Date | null | undefined): boolean => {
  const parsed = parseDate(dueDate);
  if (!parsed) return false;
  const today = getToday();
  return isBefore(parsed, today);
};

export const isOverdue = (dueDate: string | Date): boolean => {
  const due = parseDate(dueDate);
  if (!due) return false;
  return isBefore(due, startOfDay(new Date()));
};

/**
 * Accurately calculates calendar difference in years, months, and days between two dates.
 * Example: 10 Jan 2026 to 2 Sep 2026 -> "7 months 23 days"
 * Example: 10 Jan 2026 to 15 Sep 2026 -> "8 months 5 days"
 */
export const calculateCalendarTenure = (
  startDateStr: string | Date | null | undefined,
  endDateStr: string | Date | null | undefined = new Date()
): {
  years: number;
  months: number;
  days: number;
  totalDays: number;
  formatted: string;
} => {
  if (!startDateStr) {
    return { years: 0, months: 0, days: 0, totalDays: 0, formatted: '0 days' };
  }

  const startClean = typeof startDateStr === 'string'
    ? startDateStr.split('T')[0].split(' ')[0]
    : startDateStr.toISOString().split('T')[0];

  const endClean = !endDateStr
    ? new Date().toISOString().split('T')[0]
    : typeof endDateStr === 'string'
    ? endDateStr.split('T')[0].split(' ')[0]
    : endDateStr.toISOString().split('T')[0];

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
    // Borrow days from the previous month of the end date
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
};

/**
 * Formats elapsed tenure duration between two dates (e.g. from loan disbursal until today or settlement)
 */
export const formatElapsedTenure = (
  startDate: string | Date,
  endDate: string | Date = new Date(),
  isCompleted: boolean = false
): { elapsedDays: number; formatted: string } => {
  const result = calculateCalendarTenure(startDate, endDate);
  return {
    elapsedDays: result.totalDays,
    formatted: isCompleted ? `Settled: ${result.formatted}` : result.formatted,
  };
};

/**
 * Accurately calculates interest accrued for any active principal balance across a calendar window.
 * - Monthly Standard: Charged for full months (any partial month entered charges 1 full month).
 * - Daily: Pro-rated strictly per day.
 */
export const calculatePeriodicAccrual = (
  activePrincipal: number,
  rate: number,
  rateType: 'monthly' | 'daily' | 'flat' = 'monthly',
  startDateStr: string | Date,
  endDateStr: string | Date = new Date()
): number => {
  if (activePrincipal <= 0 || rate <= 0) return 0;

  const p = Number(activePrincipal);
  const r = Number(rate) / 100;
  const tenure = calculateCalendarTenure(startDateStr, endDateStr);

  if (rateType === 'daily') {
    const dailyRate = r / 30;
    return Math.round(p * dailyRate * tenure.totalDays * 100) / 100;
  }

  if (rateType === 'flat') {
    return Math.round(p * r * 100) / 100;
  }

  // Monthly Market-Style: Completed Month Interest + Partial Month Daily Interest (÷ 30)
  const completedMonths = tenure.years * 12 + tenure.months;
  const remainingDays = tenure.days;
  const monthlyInterest = p * r;
  const dailyInterest = monthlyInterest / 30;

  return Math.round((completedMonths * monthlyInterest + remainingDays * dailyInterest) * 100) / 100;
};


