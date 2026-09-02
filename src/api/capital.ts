import apiClient from './client';
import {
  CapitalTransaction,
  CapitalBalance,
  CapitalSummary,
  CapitalCreate,
  CapitalUpdate,
  CapitalFilterParams,
  CapitalListResponse,
} from '@/types/capital';

export const capitalApi = {
  list: (params?: CapitalFilterParams) =>
    apiClient.get<CapitalListResponse>('/capital', { params }),

  get: (id: number | string) =>
    apiClient.get<CapitalTransaction>(`/capital/${id}`),

  create: (data: CapitalCreate) =>
    apiClient.post<CapitalTransaction>('/capital', data),

  update: (id: number | string, data: CapitalUpdate) =>
    apiClient.put<CapitalTransaction>(`/capital/${id}`, data),

  delete: (id: number | string) =>
    apiClient.delete<{ success: boolean; message: string }>(`/capital/${id}`),

  getBalance: () =>
    apiClient.get<CapitalBalance>('/capital/balance'),

  getSummary: (year?: number) =>
    apiClient.get<CapitalSummary[]>('/capital/summary', { params: { year } }),
};

export default capitalApi;
