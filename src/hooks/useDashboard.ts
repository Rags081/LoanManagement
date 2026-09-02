import { useQuery } from '@tanstack/react-query';
import dashboardApi from '@/api/dashboard';

export const DASHBOARD_KEYS = {
  all: ['dashboard'] as const,
  metrics: () => [...DASHBOARD_KEYS.all, 'metrics'] as const,
  capital: () => [...DASHBOARD_KEYS.all, 'capital'] as const,
  loans: () => [...DASHBOARD_KEYS.all, 'loans'] as const,
  collections: () => [...DASHBOARD_KEYS.all, 'collections'] as const,
  profit: () => [...DASHBOARD_KEYS.all, 'profit'] as const,
  trends: (period: string) => [...DASHBOARD_KEYS.all, 'trends', period] as const,
  recentActivity: (limit?: number) => [...DASHBOARD_KEYS.all, 'recent-activity', limit] as const,
  overdue: () => [...DASHBOARD_KEYS.all, 'overdue'] as const,
};

export const useDashboardMetrics = (refetchInterval?: number | false) => {
  return useQuery({
    queryKey: DASHBOARD_KEYS.metrics(),
    queryFn: async () => {
      const response = await dashboardApi.getMetrics();
      return response.data;
    },
    refetchInterval: refetchInterval || false,
  });
};

export const useCapitalMetrics = () => {
  return useQuery({
    queryKey: DASHBOARD_KEYS.capital(),
    queryFn: async () => {
      const response = await dashboardApi.getCapital();
      return response.data;
    },
  });
};

export const useLoanMetrics = () => {
  return useQuery({
    queryKey: DASHBOARD_KEYS.loans(),
    queryFn: async () => {
      const response = await dashboardApi.getLoans();
      return response.data;
    },
  });
};

export const useCollectionMetrics = () => {
  return useQuery({
    queryKey: DASHBOARD_KEYS.collections(),
    queryFn: async () => {
      const response = await dashboardApi.getCollections();
      return response.data;
    },
  });
};

export const useProfitMetrics = () => {
  return useQuery({
    queryKey: DASHBOARD_KEYS.profit(),
    queryFn: async () => {
      const response = await dashboardApi.getProfit();
      return response.data;
    },
  });
};

export const useDashboardTrends = (
  period: 'daily' | 'weekly' | 'monthly' = 'monthly',
  refetchInterval?: number | false
) => {
  return useQuery({
    queryKey: DASHBOARD_KEYS.trends(period),
    queryFn: async () => {
      const response = await dashboardApi.getTrends(period);
      return response.data;
    },
    refetchInterval: refetchInterval || false,
  });
};

export const useRecentActivity = (limit: number = 10, refetchInterval?: number | false) => {
  return useQuery({
    queryKey: DASHBOARD_KEYS.recentActivity(limit),
    queryFn: async () => {
      const response = await dashboardApi.getRecentActivity(limit);
      return response.data;
    },
    refetchInterval: refetchInterval || false,
  });
};

export const useOverdueAlerts = (refetchInterval?: number | false) => {
  return useQuery({
    queryKey: DASHBOARD_KEYS.overdue(),
    queryFn: async () => {
      const response = await dashboardApi.getOverdue();
      return response.data;
    },
    refetchInterval: refetchInterval || false,
  });
};
