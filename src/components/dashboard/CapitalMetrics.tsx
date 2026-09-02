import React from 'react';
import { CapitalMetrics as CapitalMetricsType } from '@/types/dashboard';
import { formatCurrency } from '@/utils/formatters';
import { MetricsCard } from './MetricsCard';
import { Landmark, ArrowDownLeft, ArrowUpRight, Wallet } from 'lucide-react';

interface CapitalMetricsProps {
  metrics?: CapitalMetricsType;
  isLoading?: boolean;
}

export const CapitalMetrics: React.FC<CapitalMetricsProps> = ({
  metrics,
  isLoading = false,
}) => {
  const cards = [
    {
      title: 'Total Capital Invested',
      value: metrics ? formatCurrency(metrics.totalGiven) : '₹0',
      subtitle: 'Money added to the lending pool',
      icon: <ArrowDownLeft className="w-5 h-5 text-emerald-600" />,
      bg: 'bg-emerald-50/70 border-emerald-200/70',
      badge: { text: 'Invested', type: 'success' as const },
    },
    {
      title: 'Capital Withdrawn',
      value: metrics ? formatCurrency(metrics.totalReturned) : '₹0',
      subtitle: 'Money taken back by owners',
      icon: <ArrowUpRight className="w-5 h-5 text-rose-600" />,
      bg: 'bg-rose-50/70 border-rose-200/70',
      badge: { text: 'Withdrawn', type: 'danger' as const },
    },
    {
      title: 'Net Capital Invested',
      value: metrics ? formatCurrency(metrics.currentBalance) : '₹0',
      subtitle: 'Total invested minus withdrawn',
      icon: <Landmark className="w-5 h-5 text-indigo-600" />,
      bg: 'bg-indigo-50/70 border-indigo-200/70',
      badge: { text: 'Net Fund', type: 'neutral' as const },
    },
    {
      title: 'Available Cash to Lend',
      value: metrics ? formatCurrency(metrics.unallocated) : '₹0',
      subtitle: 'Actual cash in hand for new loans',
      icon: <Wallet className="w-5 h-5 text-amber-600" />,
      bg: 'bg-amber-50/70 border-amber-200/70',
      badge: { text: 'Cash in Hand', type: 'warning' as const },
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Landmark className="w-4 h-4 text-indigo-600" />
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">1. Capital & Available Cash</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

export default CapitalMetrics;
