import apiClient from './client';
import {
  Payment,
  PaymentWithLoan,
  PaymentCreate,
  PaymentVoid,
  PaymentFilterParams,
  PaymentListResponse,
  PaymentSummary,
} from '@/types/payment';

export const paymentsApi = {
  /**
   * Get paginated list of payments with filters & search
   */
  list: async (params?: PaymentFilterParams) => {
    return apiClient.get<PaymentListResponse>('/payments', { params });
  },

  /**
   * Get summary metrics for payments (supports filters)
   */
  getSummary: async (params?: PaymentFilterParams) => {
    return apiClient.get<PaymentSummary>('/payments/summary', { params });
  },

  /**
   * Get single payment by ID with allocation records and loan metadata
   */
  get: async (id: number | string) => {
    return apiClient.get<PaymentWithLoan>(`/payments/${id}`);
  },

  /**
   * Get all payment records for a specific loan
   */
  getByLoan: async (loanId: number | string) => {
    return apiClient.get<PaymentWithLoan[]>(`/payments/loan/${loanId}`);
  },

  /**
   * Get total received for a loan
   */
  getTotalByLoan: async (loanId: number | string) => {
    return apiClient.get<{ total: number; principalTotal: number; interestTotal: number }>(`/payments/loan/${loanId}/total`);
  },

  /**
   * Get list of payment modes
   */
  getModes: async () => {
    return apiClient.get<{ value: string; label: string }[]>('/payments/modes');
  },

  /**
   * Record new repayment
   */
  create: async (data: PaymentCreate) => {
    return apiClient.post<Payment>('/payments', data);
  },

  /**
   * Void payment transaction (Admin only)
   */
  void: async (id: number | string, data: PaymentVoid) => {
    return apiClient.post<Payment>(`/payments/${id}/void`, data);
  },
};

export default paymentsApi;
