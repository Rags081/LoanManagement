export const APP_NAME = 'Loan Management System';
export const APP_VERSION = '1.0.0';

export const CURRENCY_SYMBOL = '₹';
export const CURRENCY_FORMAT = 'en-IN';

export const DATE_FORMAT = 'yyyy-MM-dd';
export const DATE_FORMAT_DISPLAY = 'dd MMM yyyy';
export const DATE_FORMAT_API = 'yyyy-MM-dd';
export const DATE_TIME_FORMAT_DISPLAY = 'dd MMM yyyy, hh:mm a';

export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

// Loan Status
export const LOAN_STATUS = {
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
  CLOSED: 'CLOSED',
  DEFAULTED: 'DEFAULTED',
  REJECTED: 'REJECTED',
} as const;

export const LOAN_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending Approval',
  ACTIVE: 'Active',
  CLOSED: 'Closed / Settled',
  DEFAULTED: 'Defaulted',
  REJECTED: 'Rejected',
};

export const LOAN_STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  PENDING: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
  ACTIVE: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  CLOSED: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  DEFAULTED: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  REJECTED: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' },
};

// Payment Mode
export const PAYMENT_MODE = {
  CASH: 'CASH',
  BANK_TRANSFER: 'BANK_TRANSFER',
  CHEQUE: 'CHEQUE',
  UPI: 'UPI',
  ONLINE: 'ONLINE',
} as const;

export const PAYMENT_MODE_LABELS: Record<string, string> = {
  CASH: 'Cash',
  BANK_TRANSFER: 'Bank Transfer (NEFT/RTGS/IMPS)',
  CHEQUE: 'Cheque',
  UPI: 'UPI / QR',
  ONLINE: 'Online Gateway',
};

// Interest Type
export const INTEREST_TYPE = {
  FLAT: 'FLAT',
  REDUCING: 'REDUCING',
} as const;

export const INTEREST_TYPE_LABELS: Record<string, string> = {
  FLAT: 'Flat Interest',
  REDUCING: 'Reducing Balance',
};

// Tenure Unit
export const TENURE_UNIT = {
  DAYS: 'DAYS',
  WEEKS: 'WEEKS',
  MONTHS: 'MONTHS',
  YEARS: 'YEARS',
} as const;

export const TENURE_UNIT_LABELS: Record<string, string> = {
  DAYS: 'Days',
  WEEKS: 'Weeks',
  MONTHS: 'Months',
  YEARS: 'Years',
};

// Capital Transaction Type
export const CAPITAL_TRANSACTION_TYPE = {
  INJECTION: 'INJECTION',
  WITHDRAWAL: 'WITHDRAWAL',
  PROFIT_SHARE: 'PROFIT_SHARE',
  EXPENSE: 'EXPENSE',
} as const;

export const CAPITAL_TRANSACTION_TYPE_LABELS: Record<string, string> = {
  INJECTION: 'Capital Injection / Deposit',
  WITHDRAWAL: 'Capital Withdrawal / Draw',
  PROFIT_SHARE: 'Profit Distribution',
  EXPENSE: 'Operational Expense',
};

// User Roles
export const USER_ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  OPERATOR: 'OPERATOR',
  VIEWER: 'VIEWER',
} as const;

export const USER_ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Administrator',
  ADMIN: 'Administrator',
  MANAGER: 'Loan Manager',
  OPERATOR: 'Data Entry Operator',
  VIEWER: 'Viewer / Auditor',
};
