import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import paymentsApi from '@/api/payments';
import { PaymentCreate, PaymentVoid, PaymentFilterParams } from '@/types/payment';
import { LOAN_KEYS } from './useLoans';
import toast from 'react-hot-toast';

export const PAYMENT_KEYS = {
  all: ['payments'] as const,
  lists: () => [...PAYMENT_KEYS.all, 'list'] as const,
  list: (params?: PaymentFilterParams) => [...PAYMENT_KEYS.lists(), params] as const,
  details: () => [...PAYMENT_KEYS.all, 'detail'] as const,
  detail: (id: number | string) => [...PAYMENT_KEYS.details(), id] as const,
  byLoan: (loanId: number | string) => [...PAYMENT_KEYS.all, 'loan', loanId] as const,
  loanTotal: (loanId: number | string) => [...PAYMENT_KEYS.all, 'loan-total', loanId] as const,
  summary: (params?: PaymentFilterParams) => [...PAYMENT_KEYS.all, 'summary', params] as const,
  modes: () => [...PAYMENT_KEYS.all, 'modes'] as const,
};

export const usePaymentList = (params?: PaymentFilterParams) => {
  return useQuery({
    queryKey: PAYMENT_KEYS.list(params),
    queryFn: async () => {
      const response = await paymentsApi.list(params);
      return response.data;
    },
  });
};

export const usePayment = (id: number | string | undefined) => {
  return useQuery({
    queryKey: PAYMENT_KEYS.detail(id || 0),
    queryFn: async () => {
      if (!id) return null;
      const response = await paymentsApi.get(id);
      return response.data;
    },
    enabled: !!id && Number(id) > 0,
  });
};

export const usePaymentsByLoan = (loanId: number | string | undefined) => {
  return useQuery({
    queryKey: PAYMENT_KEYS.byLoan(loanId || 0),
    queryFn: async () => {
      if (!loanId) return [];
      const response = await paymentsApi.getByLoan(loanId);
      return response.data;
    },
    enabled: !!loanId && Number(loanId) > 0,
  });
};

export const usePaymentTotal = (loanId: number | string | undefined) => {
  return useQuery({
    queryKey: PAYMENT_KEYS.loanTotal(loanId || 0),
    queryFn: async () => {
      if (!loanId) return { total: 0, principalTotal: 0, interestTotal: 0 };
      const response = await paymentsApi.getTotalByLoan(loanId);
      return response.data;
    },
    enabled: !!loanId && Number(loanId) > 0,
  });
};

export const usePaymentSummary = (params?: PaymentFilterParams) => {
  return useQuery({
    queryKey: PAYMENT_KEYS.summary(params),
    queryFn: async () => {
      const response = await paymentsApi.getSummary(params);
      return response.data;
    },
  });
};

export const usePaymentModes = () => {
  return useQuery({
    queryKey: PAYMENT_KEYS.modes(),
    queryFn: async () => {
      const response = await paymentsApi.getModes();
      return response.data;
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });
};

export const useCreatePayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: PaymentCreate) => paymentsApi.create(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: PAYMENT_KEYS.all });
      queryClient.invalidateQueries({ queryKey: LOAN_KEYS.all });
      toast.success(`Payment "${response.data.paymentId}" recorded successfully!`);
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      const message = error.response?.data?.message || 'Failed to record payment.';
      toast.error(message);
    },
  });
};

export const useVoidPayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: PaymentVoid }) =>
      paymentsApi.void(id, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: PAYMENT_KEYS.all });
      queryClient.invalidateQueries({ queryKey: LOAN_KEYS.all });
      toast.success(`Payment "${response.data.paymentId}" has been voided.`);
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      const message = error.response?.data?.message || 'Failed to void payment.';
      toast.error(message);
    },
  });
};
