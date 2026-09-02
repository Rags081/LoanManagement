import React from 'react';
import { ProfitMetrics as ProfitMetricsType } from '@/types/dashboard';
import { formatCurrency } from '@/utils/formatters';
import { MetricsCard } from './MetricsCard';
import { TrendingUp, CheckCircle2, Clock } from 'lucide-react';

interface ProfitMetricsProps {
  metrics?: ProfitMetricsType;
  isLoading?: boolean;
}

export const ProfitMetrics: React.FC<ProfitMetricsProps> = ({
  metrics,
  isLoading = false,
}) => {
  const cards = [
    {
      title: 'Total Expected Interest',
      value: metrics ? formatCurrency(metrics.expectedInterest) : '₹0',
      subtitle: 'Target interest across all loans',
      icon: <TrendingUp className="w-5 h-5 text-indigo-600" />,
      bg: 'bg-indigo-50/70 border-indigo-200/70',
      badge: { text: 'Target', type: 'neutral' as const },
    },
    {
      title: 'Interest Profit Earned',
      value: metrics ? formatCurrency(metrics.realizedInterest) : '₹0',
      subtitle: 'Actual profit already received',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
      bg: 'bg-emerald-50/70 border-emerald-200/70',
      badge: { text: 'In Hand', type: 'success' as const },
    },
    {
      title: 'Interest Left to Collect',
      value: metrics ? formatCurrency(metrics.pendingInterest) : '₹0',
      subtitle: 'Remaining profit to receive',
      icon: <Clock className="w-5 h-5 text-amber-600" />,
      bg: 'bg-amber-50/70 border-amber-200/70',
      badge: { text: 'Uncollected', type: 'warning' as const },
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-indigo-600" />
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">4. Interest Earnings & Profit</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map((c, i) => (
          <MetricsCard
            key={i}
            title={c.title}
            value={c.value}
            subtitle={c.subtitle}
            icon={c.icon}
            bg={c.bg}
            trendBadge={c.badge}
            isLoading={isLoading}
          />
        ))}
      </div>
    </div>
  );
};

export default ProfitMetrics;
