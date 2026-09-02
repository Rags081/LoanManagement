import React from 'react';
import { LoanMetrics as LoanMetricsType } from '@/types/dashboard';
import { formatCurrency } from '@/utils/formatters';
import { MetricsCard } from './MetricsCard';
import { HandCoins, Clock, AlertTriangle, CheckCircle2, PieChart } from 'lucide-react';

interface LoanMetricsProps {
  metrics?: LoanMetricsType;
  isLoading?: boolean;
}

export const LoanMetrics: React.FC<LoanMetricsProps> = ({
  metrics,
  isLoading = false,
}) => {
  const cards = [
    {
      title: 'Total Money Given as Loans',
      value: metrics ? formatCurrency(metrics.totalLent) : '₹0',
      subtitle: `${metrics?.totalLoans || 0} Total Loans Issued`,
      icon: <HandCoins className="w-5 h-5 text-indigo-600" />,
      bg: 'bg-indigo-50/70 border-indigo-200/70',
      badge: { text: 'Total Lent', type: 'neutral' as const },
    },
    {
      title: 'Running Loans (Active)',
      value: metrics?.activeLoans.toString() || '0',
      subtitle: 'Borrowers currently repaying',
      icon: <Clock className="w-5 h-5 text-blue-600" />,
      bg: 'bg-blue-50/70 border-blue-200/70',
      badge: { text: 'Active', type: 'neutral' as const },
    },
    {
      title: 'Late / Overdue Loans',
      value: metrics?.overdueLoans.toString() || '0',
      subtitle: 'Loans past scheduled due date',
      icon: <AlertTriangle className="w-5 h-5 text-rose-600" />,
      bg: 'bg-rose-50/70 border-rose-200/70',
      badge: { text: 'Overdue', type: 'danger' as const },
    },
    {
      title: 'Fully Closed Loans',
      value: metrics?.completedLoans.toString() || '0',
      subtitle: '100% repaid and settled',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
      bg: 'bg-emerald-50/70 border-emerald-200/70',
      badge: { text: 'Closed', type: 'success' as const },
    },
    {
      title: 'Partially Repaid Loans',
      value: metrics?.partiallyPaidLoans.toString() || '0',
      subtitle: 'Active loans with some principal paid',
      icon: <PieChart className="w-5 h-5 text-purple-600" />,
      bg: 'bg-purple-50/70 border-purple-200/70',
      badge: { text: 'In Progress', type: 'neutral' as const },
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <HandCoins className="w-4 h-4 text-indigo-600" />
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">2. Loan Status & Distribution</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
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

export default LoanMetrics;
