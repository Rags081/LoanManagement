export type BorrowerStatus = 'active' | 'inactive' | 'blacklisted';

export interface Borrower {
  id: number;
  borrowerId: string;
  fullName: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
  status: BorrowerStatus;
  createdBy: number;
  creatorName?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface BorrowerStats {
  totalLoans: number;
  activeLoans: number;
  completedLoans: number;
  totalPrincipalBorrowed: number;
  totalPrincipalRepaid: number;
  totalInterestPaid: number;
  totalOutstanding: number;
}

export interface BorrowerLoanSummary {
  id: number;
  loanId: string;
  principalAmount: number;
  interestRate: number;
  interestRateType: 'monthly' | 'daily' | 'flat';
  tenure: number;
  tenureUnit: 'days' | 'months' | 'years';
  loanGivenDate: string;
  dueDate: string;
  totalExpectedRepayment: number;
  status: 'active' | 'overdue' | 'completed' | 'cancelled';
  totalPaid: number;
  outstandingBalance: number;
  createdAt: string;
}

export interface BorrowerWithStats extends Borrower {
  stats: BorrowerStats;
  loans?: BorrowerLoanSummary[];
}

export interface BorrowerCreate {
  fullName: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
  status?: BorrowerStatus;
}

export interface BorrowerUpdate {
  fullName?: string;
  phone?: string;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
  status?: BorrowerStatus;
}

export interface BorrowerFilterParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}

export interface BorrowerListResponse {
  data: Borrower[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
