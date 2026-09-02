import apiClient from './client';
import {
  Borrower,
  BorrowerWithStats,
  BorrowerStats,
  BorrowerLoanSummary,
  BorrowerCreate,
  BorrowerUpdate,
  BorrowerFilterParams,
  BorrowerListResponse,
} from '@/types/borrower';

export const borrowersApi = {
  /**
   * Get paginated list of borrowers with search & status filters
   */
  list: async (params?: BorrowerFilterParams) => {
    return apiClient.get<BorrowerListResponse>('/borrowers', { params });
  },

  /**
   * Get single borrower with full stats and loan history
   */
  get: async (id: number | string) => {
    return apiClient.get<BorrowerWithStats>(`/borrowers/${id}`);
  },

  /**
   * Get credit & repayment statistics for a specific borrower
   */
  getStats: async (id: number | string) => {
    return apiClient.get<BorrowerStats>(`/borrowers/${id}/stats`);
  },

  /**
   * Get all loans history for a borrower
   */
  getLoans: async (id: number | string) => {
    return apiClient.get<BorrowerLoanSummary[]>(`/borrowers/${id}/loans`);
  },

  /**
   * Fast autocomplete search by name, phone, or Borrower ID
   */
  search: async (query: string, limit = 10) => {
    return apiClient.get<Borrower[]>('/borrowers/search', {
      params: { q: query, limit },
    });
  },

  /**
   * Create a new borrower
   */
  create: async (data: BorrowerCreate) => {
    return apiClient.post<Borrower>('/borrowers', data);
  },

  /**
   * Update borrower details
   */
  update: async (id: number | string, data: BorrowerUpdate) => {
    return apiClient.put<Borrower>(`/borrowers/${id}`, data);
  },

  /**
   * Soft-delete a borrower (Requires no active loans)
   */
  delete: async (id: number | string) => {
    return apiClient.delete<{ success: boolean; message: string }>(`/borrowers/${id}`);
  },
};

export default borrowersApi;
