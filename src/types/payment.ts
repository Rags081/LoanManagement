import { LoanWithBorrower } from './loan';

export type PaymentMode = 'cash' | 'upi' | 'bank_transfer' | 'other';
export type AllocationMethod = 'interest_first' | 'principal_first' | 'proportional';

export interface PaymentAllocation {
  id: number;
  paymentId: number;
  allocatedTo: 'principal' | 'interest' | 'late_fee' | 'penalty';
  amount: number;
  runningPrincipalBalance: number;
  runningInterestBalance: number;
  createdAt: string;
}

export interface Payment {
  id: number;
  paymentId: string;
  loanId: number;
  paymentDate: string;
  paymentAmount: number;
  principalPortion: number;
  interestPortion: number;
  paymentMode: PaymentMode;
  referenceNumber?: string | null;
  notes?: string | null;
  isVoid: boolean;
  voidReason?: string | null;
  voidedAt?: string | null;
  voidedBy?: number | null;
  voidedByName?: string | null;
  createdBy: number;
  creatorName?: string | null;
  createdAt: string;
  updatedAt: string;
  allocations?: PaymentAllocation[];
}

export interface PaymentWithLoan extends Payment {
  loanCustomId?: string;
  borrowerName?: string;
  borrowerPhone?: string;
  borrowerIdCode?: string;
  loan?: LoanWithBorrower;
}

export interface PaymentCreate {
  loanId: number;
  paymentDate: string;
  paymentAmount: number;
  paymentMode: PaymentMode;
  referenceNumber?: string | null;
  notes?: string | null;
  allocationMethod?: AllocationMethod;
  principalPortion?: number;
  interestPortion?: number;
}

export interface PaymentVoid {
  voidReason: string;
}

export interface PaymentFilterParams {
  page?: number;
  limit?: number;
  loanId?: number;
  borrowerId?: number;
  paymentMode?: PaymentMode | 'all';
  isVoid?: boolean;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface PaymentListResponse {
  data: PaymentWithLoan[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaymentSummary {
  totalPayments: number;
  totalCollected: number;
  principalCollected: number;
  interestCollected: number;
  collectedThisMonth: number;
  voidedPaymentsCount: number;
  voidedAmount: number;
}
