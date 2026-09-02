import React, { useState } from 'react';
import Button from '@/components/common/Button';
import {
  CapitalMetrics,
  LoanMetrics,
  CollectionMetrics,
  ProfitMetrics,
  LoanTrendChart,
  CollectionTrendChart,
  OutstandingTrendChart,
  RecentActivityList,
  OverdueAlertList,
} from '@/components/dashboard';
import {
  useDashboardMetrics,
  useDashboardTrends,
  useRecentActivity,
  useOverdueAlerts,
} from '@/hooks/useDashboard';
import { LayoutDashboard, RotateCw } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const [trendPeriod, setTrendPeriod] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number | false>(30000); // 30 seconds default

  // Queries
  const {
    data: metricsData,
    isLoading: isMetricsLoading,
    refetch: refetchMetrics,
    isFetching: isFetchingMetrics,
  } = useDashboardMetrics(autoRefreshInterval);

  const {
    data: trendsData,
    isLoading: isTrendsLoading,
    refetch: refetchTrends,
    isFetching: isFetchingTrends,
  } = useDashboardTrends(trendPeriod, autoRefreshInterval);

  const {
    data: activityData,
    isLoading: isActivityLoading,
    refetch: refetchActivity,
  } = useRecentActivity(10, autoRefreshInterval);

  const {
    data: overdueData,
    isLoading: isOverdueLoading,
    refetch: refetchOverdue,
  } = useOverdueAlerts(autoRefreshInterval);

  const isRefreshingAny = isFetchingMetrics || isFetchingTrends;

  const handleManualRefresh = () => {
    refetchMetrics();
    refetchTrends();
    refetchActivity();
    refetchOverdue();
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Top Header & Refresh Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-indigo-600" /> Business Dashboard & Overview
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-0.5">
            Real-time summary of invested capital, running loans, money collected, and pending balances
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Auto Refresh Toggle */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-xs shadow-2xs">
            <span className="text-slate-400 font-semibold">Auto-Update:</span>
            <select
              value={autoRefreshInterval ? autoRefreshInterval.toString() : 'false'}
              onChange={(e) => {
                const val = e.target.value;
                setAutoRefreshInterval(val === 'false' ? false : Number(val));
              }}
              className="bg-transparent text-slate-700 font-bold focus:outline-none cursor-pointer"
            >
              <option value="false">Off</option>
              <option value="15000">Every 15s</option>
              <option value="30000">Every 30s</option>
              <option value="60000">Every 1 min</option>
            </select>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleManualRefresh}
            isLoading={isRefreshingAny}
            leftIcon={<RotateCw className={`w-3.5 h-3.5 ${isRefreshingAny ? 'animate-spin' : ''}`} />}
          >
            Refresh Now
          </Button>
        </div>
      </div>

      {/* 1. Capital & Liquidity Overview */}
      <CapitalMetrics
        metrics={metricsData?.capital}
        isLoading={isMetricsLoading}
      />

      {/* 2. Loan Portfolio Distribution */}
      <LoanMetrics
        metrics={metricsData?.loans}
        isLoading={isMetricsLoading}
      />

      {/* 3. Collections & Recovery Performance */}
      <CollectionMetrics
        metrics={metricsData?.collections}
        isLoading={isMetricsLoading}
      />

      {/* 4. Profit & Realization */}
      <ProfitMetrics
        metrics={metricsData?.profit}
        isLoading={isMetricsLoading}
      />

      {/* 5. Interactive Trends Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">5. Growth Charts & Collection History</h2>
            <p className="text-xs text-slate-500">Visual history of loans given, money collected, and pending balance over time</p>
          </div>

          {/* Timeframe Interval Selector */}
          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200/80 text-xs">
            <button
              onClick={() => setTrendPeriod('daily')}
              className={`px-3 py-1 font-bold rounded-lg transition-all ${
                trendPeriod === 'daily'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Daily (Last 30 Days)
            </button>
            <button
              onClick={() => setTrendPeriod('weekly')}
              className={`px-3 py-1 font-bold rounded-lg transition-all ${
                trendPeriod === 'weekly'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Weekly (Last 12 Weeks)
            </button>
            <button
              onClick={() => setTrendPeriod('monthly')}
              className={`px-3 py-1 font-bold rounded-lg transition-all ${
                trendPeriod === 'monthly'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Monthly (Last 12 Months)
            </button>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LoanTrendChart
            data={trendsData?.loans || []}
            isLoading={isTrendsLoading}
          />
          <CollectionTrendChart
            data={trendsData?.collections || []}
            isLoading={isTrendsLoading}
          />
        </div>

        {/* Full-Width Outstanding Curve */}
        <OutstandingTrendChart
          data={trendsData?.outstanding || []}
          isLoading={isTrendsLoading}
        />
      </div>

      {/* 6. Bottom Activity Stream & Overdue Account Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivityList
          activities={activityData}
          isLoading={isActivityLoading}
        />
        <OverdueAlertList
          alerts={overdueData}
          isLoading={isOverdueLoading}
        />
      </div>
    </div>
  );
};

export default Dashboard;
