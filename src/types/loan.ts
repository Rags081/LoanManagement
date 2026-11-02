import { Borrower } from './borrower';

export type LoanStatus = 'active' | 'overdue' | 'completed' | 'cancelled';
export type InterestRateType = 'monthly' | 'daily' | 'flat';
export type TenureUnit = 'days' | 'months' | 'years';

export interface Loan {
  id: number;
  loanId: string;
  borrowerId: number;
  principalAmount: number; // Original principal disbursed
  interestRate: number;
  interestRateType: InterestRateType;
  monthlyInterestAmount: number; // Monthly interest amount in ₹ on current principal
  dailyInterestAmount: number; // Daily equivalent in ₹ on current principal
  tenure?: number | null;
  tenureUnit?: TenureUnit | null;
  loanGivenDate: string;
  dueDate?: string | null;
  totalExpectedInterest?: number;
  totalExpectedRepayment?: number;
  accruedInterest: number; // Cumulative interest accrued to date across periods
  totalReceived: number; // Cumulative payments received
  principalReceived: number;
  interestReceived: number;
  principalOutstanding: number; // Remaining unpaid principal
  interestOutstanding: number; // Remaining unpaid interest
  totalOutstanding: number; // Net total balance = principalOutstanding + interestOutstanding
  status: LoanStatus;
  notes?: string | null;
  createdBy: number;
  creatorName?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  // Dynamic calendar tenure tracking
  elapsedDays: number;
  elapsedTenure: string; // e.g. "7 months 23 days"
  actualTenure: string; // e.g. "7 months 23 days"
  settlementDate?: string | null;
  lastPaymentDate?: string | null;
  isSettled: boolean;
  interestPaymentDetails?: InterestPaymentDetail[];
}

export interface InterestPaymentDetail {
  id: number;
  paymentId?: string;
  receiptNumber?: string;
  paymentDate: string;
  interestPortion: number;
  paymentAmount?: number;
  paymentMode?: string;
}

export interface LoanOutstanding {
  principalAmount: number; // Original principal
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
  // Elapsed calendar tenure tracking
  elapsedDays: number;
  elapsedTenure: string;
  actualTenure: string;
  settlementDate?: string | null;
  isCompleted: boolean;
}

export interface LoanPaymentRecord {
  id: number;
  receiptNumber: string;
  paymentDate: string;
  paymentAmount: number;
  principalPortion: number;
  interestPortion: number;
  paymentMode: 'cash' | 'upi' | 'bank_transfer' | 'cheque';
  isVoid: boolean;
  notes?: string | null;
  createdAt: string;
}

export interface LoanWithBorrower extends Loan {
  borrowerName?: string;
  borrowerPhone?: string;
  borrowerIdCode?: string;
  borrower?: Borrower;
  outstanding?: LoanOutstanding;
  payments?: LoanPaymentRecord[];
}

export interface LoanCreate {
  borrowerId: number;
  principalAmount: number;
  interestRate: number;
  interestRateType?: InterestRateType;
  tenure?: number | null;
  tenureUnit?: TenureUnit | null;
  loanGivenDate: string;
  dueDate?: string | null;
  notes?: string | null;
}

export interface LoanUpdate {
  principalAmount?: number;
  interestRate?: number;
  interestRateType?: InterestRateType;
  tenure?: number | null;
  tenureUnit?: TenureUnit | null;
  loanGivenDate?: string;
  dueDate?: string | null;
  notes?: string | null;
  status?: LoanStatus;
  settlementDate?: string | null;
}

export interface LoanFilterParams {
  page?: number;
  limit?: number;
  borrowerId?: number;
  status?: string;
  startDate?: string;
  endDate?: string;
  minRate?: number;
  maxRate?: number;
  search?: string;
  dayOfMonth?: string;
}

export interface LoanListResponse {
  data: LoanWithBorrower[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface LoanSummary {
  totalLoans: number;
  activeLoans: number;
  overdueLoans: number;
  completedLoans: number;
  cancelledLoans: number;
  totalPrincipalLent: number;
  totalExpectedInterest: number;
  totalExpectedRepayment: number;
  totalPrincipalRecovered: number;
  totalInterestRecovered: number;
  totalOutstanding: number;
}
