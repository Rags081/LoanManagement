import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import loansApi from '@/api/loans';
import { LoanCreate, LoanUpdate, LoanFilterParams, LoanStatus } from '@/types/loan';
import toast from 'react-hot-toast';

export const LOAN_KEYS = {
  all: ['loans'] as const,
  lists: () => [...LOAN_KEYS.all, 'list'] as const,
  list: (params?: LoanFilterParams) => [...LOAN_KEYS.lists(), params] as const,
  details: () => [...LOAN_KEYS.all, 'detail'] as const,
  detail: (id: number | string) => [...LOAN_KEYS.details(), id] as const,
  payments: (id: number | string) => [...LOAN_KEYS.detail(id), 'payments'] as const,
  outstanding: (id: number | string) => [...LOAN_KEYS.detail(id), 'outstanding'] as const,
  summary: (params?: LoanFilterParams) => [...LOAN_KEYS.all, 'summary', params] as const,
};

export const useLoanList = (params?: LoanFilterParams) => {
  return useQuery({
    queryKey: LOAN_KEYS.list(params),
    queryFn: async () => {
      const response = await loansApi.list(params);
      return response.data;
    },
  });
};

export const useLoan = (id: number | string | undefined) => {
  return useQuery({
    queryKey: LOAN_KEYS.detail(id || 0),
    queryFn: async () => {
      if (!id) return null;
      const response = await loansApi.get(id);
      return response.data;
    },
    enabled: !!id && Number(id) > 0,
  });
};

export const useLoanPayments = (id: number | string | undefined) => {
  return useQuery({
    queryKey: LOAN_KEYS.payments(id || 0),
    queryFn: async () => {
      if (!id) return [];
      const response = await loansApi.getPayments(id);
      return response.data;
    },
    enabled: !!id && Number(id) > 0,
  });
};

export const useLoanOutstanding = (id: number | string | undefined) => {
  return useQuery({
    queryKey: LOAN_KEYS.outstanding(id || 0),
    queryFn: async () => {
      if (!id) return null;
      const response = await loansApi.getOutstanding(id);
      return response.data;
    },
    enabled: !!id && Number(id) > 0,
  });
};

export const useLoanSummary = (params?: LoanFilterParams) => {
  return useQuery({
    queryKey: LOAN_KEYS.summary(params),
    queryFn: async () => {
      const response = await loansApi.getSummary(params);
      return response.data;
    },
  });
};

export const useCreateLoan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: LoanCreate) => loansApi.create(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: LOAN_KEYS.all });
      toast.success(`Loan "${response.data.loanId}" created and disbursed successfully!`);
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      const message = error.response?.data?.message || 'Failed to create loan.';
      toast.error(message);
    },
  });
};

export const useUpdateLoan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: LoanUpdate }) =>
      loansApi.update(id, data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: LOAN_KEYS.all });
      queryClient.invalidateQueries({ queryKey: LOAN_KEYS.detail(variables.id) });
      toast.success(`Loan "${response.data.loanId}" updated successfully!`);
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      const message = error.response?.data?.message || 'Failed to update loan details.';
      toast.error(message);
    },
  });
};

export const useUpdateLoanStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: number | string; status: LoanStatus }) =>
      loansApi.updateStatus(id, status),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: LOAN_KEYS.all });
      queryClient.invalidateQueries({ queryKey: LOAN_KEYS.detail(variables.id) });
      toast.success(`Loan status updated to ${response.data.status.toUpperCase()}`);
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      const message = error.response?.data?.message || 'Failed to update status.';
      toast.error(message);
    },
  });
};

export const useDeleteLoan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => loansApi.delete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: LOAN_KEYS.all });
      queryClient.removeQueries({ queryKey: LOAN_KEYS.detail(id) });
      toast.success('Loan deleted successfully.');
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      const message = error.response?.data?.message || 'Failed to delete loan.';
      toast.error(message);
    },
  });
};
