import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import capitalApi from '@/api/capital';
import { CapitalCreate, CapitalUpdate, CapitalFilterParams } from '@/types/capital';
import toast from 'react-hot-toast';

export const CAPITAL_KEYS = {
  all: ['capital'] as const,
  lists: () => [...CAPITAL_KEYS.all, 'list'] as const,
  list: (params?: CapitalFilterParams) => [...CAPITAL_KEYS.lists(), params] as const,
  balance: () => [...CAPITAL_KEYS.all, 'balance'] as const,
  summary: (year?: number) => [...CAPITAL_KEYS.all, 'summary', year] as const,
  details: () => [...CAPITAL_KEYS.all, 'detail'] as const,
  detail: (id: number | string) => [...CAPITAL_KEYS.details(), id] as const,
};

export const useCapitalList = (params?: CapitalFilterParams) => {
  return useQuery({
    queryKey: CAPITAL_KEYS.list(params),
    queryFn: async () => {
      const response = await capitalApi.list(params);
      return response.data;
    },
  });
};

export const useCapitalBalance = () => {
  return useQuery({
    queryKey: CAPITAL_KEYS.balance(),
    queryFn: async () => {
      const response = await capitalApi.getBalance();
      return response.data;
    },
  });
};

export const useCapitalSummary = (year?: number) => {
  return useQuery({
    queryKey: CAPITAL_KEYS.summary(year),
    queryFn: async () => {
      const response = await capitalApi.getSummary(year);
      return response.data;
    },
  });
};

export const useCreateCapital = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CapitalCreate) => capitalApi.create(data),
    onSuccess: () => {
      toast.success('Capital transaction recorded successfully!');
      queryClient.invalidateQueries({ queryKey: CAPITAL_KEYS.all });
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      toast.error(axiosErr.response?.data?.message || 'Failed to record transaction');
    },
  });
};

export const useUpdateCapital = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: CapitalUpdate }) =>
      capitalApi.update(id, data),
    onSuccess: () => {
      toast.success('Capital transaction updated successfully!');
      queryClient.invalidateQueries({ queryKey: CAPITAL_KEYS.all });
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      toast.error(axiosErr.response?.data?.message || 'Failed to update transaction');
    },
  });
};

export const useDeleteCapital = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => capitalApi.delete(id),
    onSuccess: () => {
      toast.success('Capital transaction deleted successfully!');
      queryClient.invalidateQueries({ queryKey: CAPITAL_KEYS.all });
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      toast.error(axiosErr.response?.data?.message || 'Failed to delete transaction');
    },
  });
};
