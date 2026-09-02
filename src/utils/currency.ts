import { Decimal } from '@/lib/decimal';
import { CURRENCY_SYMBOL, CURRENCY_FORMAT } from './constants';

export type NumericValue = number | string | Decimal;

export const toDecimal = (val: NumericValue | null | undefined): Decimal => {
  if (val === null || val === undefined || val === '') {
    return new Decimal(0);
  }
  if (val instanceof Decimal) {
    return val;
  }
  try {
    return new Decimal(val);
  } catch {
    return new Decimal(0);
  }
};

export const toNumber = (val: NumericValue | null | undefined): number => {
  return toDecimal(val).toNumber();
};

export const add = (a: NumericValue, b: NumericValue): Decimal => {
  return toDecimal(a).plus(toDecimal(b));
};

export const subtract = (a: NumericValue, b: NumericValue): Decimal => {
  return toDecimal(a).minus(toDecimal(b));
};

export const multiply = (a: NumericValue, b: NumericValue): Decimal => {
  return toDecimal(a).times(toDecimal(b));
};

export const divide = (a: NumericValue, b: NumericValue): Decimal => {
  const divisor = toDecimal(b);
  if (divisor.isZero()) return new Decimal(0);
  return toDecimal(a).dividedBy(divisor);
};

export const round = (a: NumericValue | null | undefined, decimalPlaces: number = 2): Decimal => {
  return toDecimal(a).toDecimalPlaces(decimalPlaces, Decimal.ROUND_HALF_UP);
};

export const gt = (a: NumericValue, b: NumericValue): boolean => {
  return toDecimal(a).greaterThan(toDecimal(b));
};

export const lt = (a: NumericValue, b: NumericValue): boolean => {
  return toDecimal(a).lessThan(toDecimal(b));
};

export const eq = (a: NumericValue, b: NumericValue): boolean => {
  return toDecimal(a).equals(toDecimal(b));
};

export const max = (...values: NumericValue[]): Decimal => {
  if (values.length === 0) return new Decimal(0);
  return Decimal.max(...values.map(toDecimal));
};

export const min = (...values: NumericValue[]): Decimal => {
  if (values.length === 0) return new Decimal(0);
  return Decimal.min(...values.map(toDecimal));
};

export const formatCurrency = (
  amount: NumericValue | null | undefined,
  includeSymbol: boolean = true,
  decimals: number = 2
): string => {
  const dec = round(amount, decimals);
  const num = dec.toNumber();

  const formatted = new Intl.NumberFormat(CURRENCY_FORMAT, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);

  return includeSymbol ? `${CURRENCY_SYMBOL} ${formatted}` : formatted;
};

export const formatCurrencyShort = (amount: NumericValue | null | undefined): string => {
  const dec = toDecimal(amount);
  const num = dec.toNumber();

  if (Math.abs(num) >= 10000000) {
    // 1 Crore
    return `${CURRENCY_SYMBOL} ${(num / 10000000).toFixed(2)} Cr`;
  }
  if (Math.abs(num) >= 100000) {
    // 1 Lakh
    return `${CURRENCY_SYMBOL} ${(num / 100000).toFixed(2)} L`;
  }
  if (Math.abs(num) >= 1000) {
    // 1 Thousand
    return `${CURRENCY_SYMBOL} ${(num / 1000).toFixed(1)} K`;
  }

  return formatCurrency(amount, true, 0);
};
