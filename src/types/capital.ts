export type CapitalTransactionType = 'capital_given' | 'capital_returned' | 'adjustment';

export interface CapitalTransaction {
  id: number;
  transactionId: string;
  transactionDate: string;
  transactionType: CapitalTransactionType;
  amount: number;
  source?: string | null;
  destination?: string | null;
  description?: string | null;
  referenceNumber?: string | null;
  notes?: string | null;
  runningBalance: number;
  createdBy: number;
  creatorName?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface CapitalBalance {
  totalGiven: number;
  totalReturned: number;
  currentBalance: number;
  transactionCount: number;
  lastUpdated?: string;
}

export interface CapitalSummary {
  period: string; // e.g. "2026-01" or "Jan 2026"
  given: number;
  returned: number;
  netFlow: number;
}

export interface CapitalCreate {
  transactionDate: string;
  transactionType: CapitalTransactionType;
  amount: number | string;
  source?: string | null;
  destination?: string | null;
  description?: string | null;
  referenceNumber?: string | null;
  notes?: string | null;
}

export interface CapitalUpdate {
  transactionDate?: string;
  transactionType?: CapitalTransactionType;
  amount?: number | string;
  source?: string | null;
  destination?: string | null;
  description?: string | null;
  referenceNumber?: string | null;
  notes?: string | null;
}

export interface CapitalFilterParams {
  page?: number;
  limit?: number;
  transactionType?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface CapitalListResponse {
  data: CapitalTransaction[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
