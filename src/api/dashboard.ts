import apiClient from './client';
import {
  CapitalMetrics,
  LoanMetrics,
  CollectionMetrics,
  ProfitMetrics,
  TrendData,
  ActivityLogItem,
  OverdueAlertItem,
  DashboardMetrics,
} from '@/types/dashboard';

export const dashboardApi = {
  /**
   * Get all dashboard metrics in a single aggregated payload
   */
  getMetrics: async () => {
    return apiClient.get<DashboardMetrics>('/dashboard/metrics');
  },

  /**
   * Get capital pool metrics
   */
  getCapital: async () => {
    return apiClient.get<CapitalMetrics>('/dashboard/capital');
  },

  /**
   * Get loan portfolio distribution metrics
   */
  getLoans: async () => {
    return apiClient.get<LoanMetrics>('/dashboard/loans');
  },

  /**
   * Get collection performance metrics
   */
  getCollections: async () => {
    return apiClient.get<CollectionMetrics>('/dashboard/collections');
  },

  /**
   * Get profit & interest metrics
   */
  getProfit: async () => {
    return apiClient.get<ProfitMetrics>('/dashboard/profit');
  },

  /**
   * Get trends time-series data for interactive charts
   */
  getTrends: async (period: 'daily' | 'weekly' | 'monthly' = 'monthly') => {
    return apiClient.get<TrendData>('/dashboard/trends', {
      params: { period },
    });
  },

  /**
   * Get recent audit activity feed
   */
  getRecentActivity: async (limit: number = 10) => {
    return apiClient.get<ActivityLogItem[]>('/dashboard/recent-activity', {
      params: { limit },
    });
  },

  /**
   * Get urgent overdue account alerts
   */
  getOverdue: async () => {
    return apiClient.get<OverdueAlertItem[]>('/dashboard/overdue');
  },
};

export default dashboardApi;
