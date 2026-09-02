import React from 'react';
import { CollectionMetrics as CollectionMetricsType } from '@/types/dashboard';
import { formatCurrency } from '@/utils/formatters';
import { MetricsCard } from './MetricsCard';
import { CreditCard, CheckCircle2, TrendingUp, AlertCircle } from 'lucide-react';

interface CollectionMetricsProps {
  metrics?: CollectionMetricsType;
  isLoading?: boolean;
}

export const CollectionMetrics: React.FC<CollectionMetricsProps> = ({
  metrics,
  isLoading = false,
}) => {
  const cards = [
    {
      title: 'Total Money Collected',
      value: metrics ? formatCurrency(metrics.totalAmountReceived) : '₹0',
      subtitle: 'Principal + Interest received back',
      icon: <CreditCard className="w-5 h-5 text-emerald-600" />,
      bg: 'bg-emerald-50/70 border-emerald-200/70',
      badge: { text: 'Collected', type: 'success' as const },
    },
    {
      title: 'Principal Collected Back',
      value: metrics ? formatCurrency(metrics.totalPrincipalReceived) : '₹0',
      subtitle: 'Original loan money returned',
      icon: <CheckCircle2 className="w-5 h-5 text-blue-600" />,
      bg: 'bg-blue-50/70 border-blue-200/70',
      badge: { text: 'Principal', type: 'neutral' as const },
    },
    {
      title: 'Interest Profit Collected',
      value: metrics ? formatCurrency(metrics.totalInterestReceived) : '₹0',
      subtitle: 'Net interest profit in hand',
      icon: <TrendingUp className="w-5 h-5 text-indigo-600" />,
      bg: 'bg-indigo-50/70 border-indigo-200/70',
      badge: { text: 'Profit', type: 'success' as const },
    },
    {
      title: 'Total Pending to Collect',
      value: metrics ? formatCurrency(metrics.totalOutstanding) : '₹0',
      subtitle: `Principal: ${metrics ? formatCurrency(metrics.outstandingPrincipal) : '₹0'} + Int: ${metrics ? formatCurrency(metrics.outstandingInterest) : '₹0'}`,
      icon: <AlertCircle className="w-5 h-5 text-amber-600" />,
      bg: 'bg-amber-50/70 border-amber-200/70',
      badge: { text: 'Pending', type: 'warning' as const },
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <CreditCard className="w-4 h-4 text-emerald-600" />
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">3. Money Collected & Total Pending</h2>
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

export default CollectionMetrics;
