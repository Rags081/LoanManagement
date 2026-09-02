import apiClient from './client';
import {
  Loan,
  LoanWithBorrower,
  LoanOutstanding,
  LoanPaymentRecord,
  LoanCreate,
  LoanUpdate,
  LoanFilterParams,
  LoanListResponse,
  LoanSummary,
  LoanStatus,
} from '@/types/loan';

export const loansApi = {
  /**
   * Get paginated list of loans with filters & search
   */
  list: async (params?: LoanFilterParams) => {
    return apiClient.get<LoanListResponse>('/loans', { params });
  },

  /**
   * Get single loan with borrower profile, outstanding balance, and payments
   */
  get: async (id: number | string) => {
    return apiClient.get<LoanWithBorrower>(`/loans/${id}`);
  },

  /**
   * Get payment records for a loan
   */
  getPayments: async (id: number | string) => {
    return apiClient.get<LoanPaymentRecord[]>(`/loans/${id}/payments`);
  },

  /**
   * Get outstanding balance calculation
   */
  getOutstanding: async (id: number | string) => {
    return apiClient.get<LoanOutstanding>(`/loans/${id}/outstanding`);
  },

  /**
   * Get portfolio loans summary (supports filter parameters)
   */
  getSummary: async (params?: LoanFilterParams) => {
    return apiClient.get<LoanSummary>('/loans/summary', { params });
  },

  /**
   * Disburse/Create new loan
   */
  create: async (data: LoanCreate) => {
    return apiClient.post<Loan>('/loans', data);
  },

  /**
   * Update loan details
   */
  update: async (id: number | string, data: LoanUpdate) => {
    return apiClient.put<Loan>(`/loans/${id}`, data);
  },

  /**
   * Update loan status (Admin only)
   */
  updateStatus: async (id: number | string, status: LoanStatus) => {
    return apiClient.post<Loan>(`/loans/${id}/status`, { status });
  },

  /**
   * Soft-delete loan (Admin only, requires no recorded payments)
   */
  delete: async (id: number | string) => {
    return apiClient.delete<{ success: boolean; message: string }>(`/loans/${id}`);
  },
};

export default loansApi;
