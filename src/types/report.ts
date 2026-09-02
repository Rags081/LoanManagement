export type ReportType =
  | 'capital-statement'
  | 'loan-report'
  | 'borrower-report'
  | 'payment-report'
  | 'outstanding-report'
  | 'overdue-report'
  | 'interest-report'
  | 'monthly-collection';

export type ExportFormat = 'excel' | 'csv' | 'pdf';

export type ImportType = 'borrowers' | 'loans' | 'payments' | 'capital';

export interface ReportFilterParams {
  startDate?: string;
  endDate?: string;
  status?: string;
  borrowerId?: number;
  loanId?: number;
  paymentMode?: string;
  year?: number;
  search?: string;
}

export interface CapitalStatementItem {
  id: number;
  transactionId: string;
  transactionDate: string;
  transactionType: 'capital_given' | 'capital_returned' | 'adjustment';
  amount: number;
  source?: string | null;
  destination?: string | null;
  runningBalance: number;
  description?: string | null;
  referenceNumber?: string | null;
}

export interface LoanReportItem {
  id: number;
  loanId: string;
  borrowerName: string;
  borrowerPhone?: string | null;
  principalAmount: number;
  interestRate: number;
  interestRateType: 'monthly' | 'daily' | 'flat';
  loanGivenDate: string;
  dueDate?: string | null;
  status: 'active' | 'overdue' | 'completed' | 'cancelled';
  settlementDate?: string | null;
  tenure: string;
  principalReceived: number;
  interestReceived: number;
  totalReceived: number;
  principalOutstanding: number;
  interestOutstanding: number;
  totalOutstanding: number;
}

export interface BorrowerReportItem {
  id: number;
  borrowerId: string;
  fullName: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  totalLoans: number;
  activeLoans: number;
  totalBorrowed: number;
  totalRepaid: number;
  principalOutstanding: number;
  totalOutstanding: number;
}

export interface PaymentReportItem {
  id: number;
  paymentId: string;
  paymentDate: string;
  loanId: string;
  borrowerName: string;
  paymentAmount: number;
  principalPortion: number;
  interestPortion: number;
  paymentMode: 'cash' | 'upi' | 'bank_transfer' | 'other';
  referenceNumber?: string | null;
  isVoid: boolean;
  voidReason?: string | null;
}

export interface OutstandingReportItem {
  id: number;
  loanId: string;
  borrowerName: string;
  borrowerPhone?: string | null;
  principalAmount: number;
  principalOutstanding: number;
  interestOutstanding: number;
  totalOutstanding: number;
  loanGivenDate: string;
  daysActive: number;
}

export interface OverdueReportItem {
  id: number;
  loanId: string;
  borrowerName: string;
  borrowerPhone?: string | null;
  principalAmount: number;
  totalOutstanding: number;
  dueDate: string;
  daysOverdue: number;
}

export interface InterestReportItem {
  period: string;
  expectedInterest: number;
  realizedInterest: number;
  pendingInterest: number;
}

export interface MonthlyCollectionItem {
  month: string;
  year: number;
  principalCollected: number;
  interestCollected: number;
  totalCollected: number;
  paymentCount: number;
}

export interface ImportRowError {
  row: number;
  field: string;
  message: string;
  data?: Record<string, unknown>;
}

export interface ImportResult {
  success: boolean;
  totalRows: number;
  importedCount: number;
  errorCount: number;
  errors: ImportRowError[];
  message: string;
}

export interface ImportTemplateInfo {
  type: ImportType;
  title: string;
  description: string;
  filename: string;
  columns: string[];
  sampleRow: Record<string, string | number>;
}
