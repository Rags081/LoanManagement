import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import borrowersApi from '@/api/borrowers';
import { BorrowerCreate, BorrowerUpdate, BorrowerFilterParams } from '@/types/borrower';
import toast from 'react-hot-toast';

export const BORROWER_KEYS = {
  all: ['borrowers'] as const,
  lists: () => [...BORROWER_KEYS.all, 'list'] as const,
  list: (params?: BorrowerFilterParams) => [...BORROWER_KEYS.lists(), params] as const,
  details: () => [...BORROWER_KEYS.all, 'detail'] as const,
  detail: (id: number | string) => [...BORROWER_KEYS.details(), id] as const,
  stats: (id: number | string) => [...BORROWER_KEYS.detail(id), 'stats'] as const,
  loans: (id: number | string) => [...BORROWER_KEYS.detail(id), 'loans'] as const,
  search: (q: string) => [...BORROWER_KEYS.all, 'search', q] as const,
};

export const useBorrowerList = (params?: BorrowerFilterParams) => {
  return useQuery({
    queryKey: BORROWER_KEYS.list(params),
    queryFn: async () => {
      const response = await borrowersApi.list(params);
      return response.data;
    },
  });
};

export const useBorrower = (id: number | string | undefined) => {
  return useQuery({
    queryKey: BORROWER_KEYS.detail(id || 0),
    queryFn: async () => {
      if (!id) return null;
      const response = await borrowersApi.get(id);
      return response.data;
    },
    enabled: !!id && Number(id) > 0,
  });
};

export const useBorrowerStats = (id: number | string | undefined) => {
  return useQuery({
    queryKey: BORROWER_KEYS.stats(id || 0),
    queryFn: async () => {
      if (!id) return null;
      const response = await borrowersApi.getStats(id);
      return response.data;
    },
    enabled: !!id && Number(id) > 0,
  });
};

export const useBorrowerLoans = (id: number | string | undefined) => {
  return useQuery({
    queryKey: BORROWER_KEYS.loans(id || 0),
    queryFn: async () => {
      if (!id) return [];
      const response = await borrowersApi.getLoans(id);
      return response.data;
    },
    enabled: !!id && Number(id) > 0,
  });
};

export const useBorrowerSearch = (queryText: string) => {
  return useQuery({
    queryKey: BORROWER_KEYS.search(queryText),
    queryFn: async () => {
      if (!queryText || queryText.trim().length < 2) return [];
      const response = await borrowersApi.search(queryText);
      return response.data;
    },
    enabled: !!queryText && queryText.trim().length >= 2,
    staleTime: 60 * 1000,
  });
};

export const useCreateBorrower = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BorrowerCreate) => borrowersApi.create(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: BORROWER_KEYS.all });
      toast.success(`Borrower "${response.data.fullName}" (${response.data.borrowerId}) registered successfully!`);
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      const message = error.response?.data?.message || 'Failed to create borrower. Please try again.';
      toast.error(message);
    },
  });
};

export const useUpdateBorrower = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: BorrowerUpdate }) =>
      borrowersApi.update(id, data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: BORROWER_KEYS.all });
      queryClient.invalidateQueries({ queryKey: BORROWER_KEYS.detail(variables.id) });
      toast.success(`Borrower "${response.data.fullName}" updated successfully!`);
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      const message = error.response?.data?.message || 'Failed to update borrower profile.';
      toast.error(message);
    },
  });
};

export const useDeleteBorrower = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => borrowersApi.delete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: BORROWER_KEYS.all });
      queryClient.removeQueries({ queryKey: BORROWER_KEYS.detail(id) });
      toast.success('Borrower deleted successfully.');
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      const message = error.response?.data?.message || 'Failed to delete borrower.';
      toast.error(message);
    },
  });
};
