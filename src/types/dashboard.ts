export interface CapitalMetrics {
  totalGiven: number;
  totalReturned: number;
  currentBalance: number;
  unallocated: number;
}

export interface LoanMetrics {
  totalLoans: number;
  activeLoans: number;
  overdueLoans: number;
  completedLoans: number;
  cancelledLoans: number;
  partiallyPaidLoans: number;
  totalLent: number;
}

export interface CollectionMetrics {
  totalPrincipalReceived: number;
  totalInterestReceived: number;
  totalAmountReceived: number;
  outstandingPrincipal: number;
  outstandingInterest: number;
  totalOutstanding: number;
}

export interface ProfitMetrics {
  expectedInterest: number;
  realizedInterest: number;
  pendingInterest: number;
}

export interface LoanTrendPoint {
  period: string;
  count: number;
  amount: number;
}

export interface CollectionTrendPoint {
  period: string;
  principal: number;
  interest: number;
  total: number;
}

export interface OutstandingTrendPoint {
  period: string;
  outstanding: number;
}

export interface TrendData {
  period: 'daily' | 'weekly' | 'monthly';
  loans: LoanTrendPoint[];
  collections: CollectionTrendPoint[];
  outstanding: OutstandingTrendPoint[];
}

export interface ActivityLogItem {
  id: number;
  timestamp: string;
  action: string;
  entity: string;
  entityId: string;
  user: string;
  details?: string | null;
}

export interface OverdueAlertItem {
  id: number;
  loanId: string;
  borrowerName: string;
  borrowerPhone?: string;
  principalAmount: number;
  totalOutstanding: number;
  dueDate?: string | null;
  daysOverdue: number;
}

export interface DashboardMetrics {
  capital: CapitalMetrics;
  loans: LoanMetrics;
  collections: CollectionMetrics;
  profit: ProfitMetrics;
  registeredBorrowersCount: number;
}
