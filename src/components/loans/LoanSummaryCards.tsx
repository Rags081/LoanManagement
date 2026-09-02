import React from 'react';
import Card from '@/components/common/Card';
import { LoanSummary } from '@/types/loan';
import { formatCurrency } from '@/utils/formatters';
import { HandCoins, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface LoanSummaryCardsProps {
  summary?: LoanSummary;
  isLoading?: boolean;
}

export const LoanSummaryCards: React.FC<LoanSummaryCardsProps> = ({
  summary,
  isLoading = false,
}) => {
  const cards = [
    {
      title: 'Total Principal Lent',
      value: summary ? formatCurrency(summary.totalPrincipalLent) : '₹0',
      subtitle: `${summary?.totalLoans || 0} Total Loans Issued`,
      icon: <HandCoins className="w-5 h-5 text-indigo-600" />,
      bg: 'bg-indigo-50 border-indigo-100',
    },
    {
      title: 'Active Portfolio',
      value: summary ? formatCurrency(summary.totalOutstanding) : '₹0',
      subtitle: `${summary?.activeLoans || 0} Active Loans`,
      icon: <Clock className="w-5 h-5 text-emerald-600" />,
      bg: 'bg-emerald-50 border-emerald-100',
    },
    {
      title: 'Overdue Loans',
      value: summary?.overdueLoans.toString() || '0',
      subtitle: 'Requiring immediate collection',
      icon: <AlertTriangle className="w-5 h-5 text-rose-600" />,
      bg: 'bg-rose-50 border-rose-100',
    },
    {
      title: 'Total Recovered',
      value: summary ? formatCurrency(summary.totalPrincipalRecovered + summary.totalInterestRecovered) : '₹0',
      subtitle: `${summary?.completedLoans || 0} Completed Loans`,
      icon: <CheckCircle2 className="w-5 h-5 text-blue-600" />,
      bg: 'bg-blue-50 border-blue-100',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c, i) => (
        <Card key={i} className={`p-4 border ${c.bg} transition-all hover:shadow-md`}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                {c.title}
              </p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">
                {isLoading ? (
                  <span className="inline-block w-24 h-7 bg-slate-200 animate-pulse rounded" />
                ) : (
                  c.value
                )}
              </h3>
              <p className="text-xs text-slate-500 mt-1">{c.subtitle}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-white shadow-sm border border-slate-100">
              {c.icon}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default LoanSummaryCards;
