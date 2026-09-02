import React from 'react';
import Card from '@/components/common/Card';
import { BorrowerStats } from '@/types/borrower';
import { formatCurrency } from '@/utils/currency';
import { FileText, Clock, ArrowUpRight, Wallet } from 'lucide-react';

interface BorrowerStatsCardsProps {
  stats?: BorrowerStats | null;
  isLoading?: boolean;
}

export const BorrowerStatsCards: React.FC<BorrowerStatsCardsProps> = ({
  stats,
  isLoading = false,
}) => {
  const cards = [
    {
      title: 'Total Loans',
      value: stats?.totalLoans ?? 0,
      icon: <FileText className="w-5 h-5 text-indigo-600" />,
      bg: 'bg-indigo-50',
      border: 'border-indigo-100',
      isCurrency: false,
    },
    {
      title: 'Active Loans',
      value: stats?.activeLoans ?? 0,
      icon: <Clock className="w-5 h-5 text-amber-600" />,
      bg: 'bg-amber-50',
      border: 'border-amber-100',
      isCurrency: false,
    },
    {
      title: 'Total Borrowed',
      value: stats?.totalPrincipalBorrowed ?? 0,
      icon: <ArrowUpRight className="w-5 h-5 text-emerald-600" />,
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
      isCurrency: true,
    },
    {
      title: 'Outstanding Balance',
      value: stats?.totalOutstanding ?? 0,
      icon: <Wallet className="w-5 h-5 text-rose-600" />,
      bg: 'bg-rose-50',
      border: 'border-rose-100',
      isCurrency: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
      {cards.map((card, idx) => (
        <Card
          key={idx}
          className={`p-4 border ${card.border} hover:shadow-md transition-shadow`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {card.title}
            </span>
            <div className={`p-2 rounded-xl ${card.bg}`}>{card.icon}</div>
          </div>
          <div className="mt-2.5">
            {isLoading ? (
              <div className="h-6 w-20 bg-slate-200 animate-pulse rounded" />
            ) : (
              <p className="text-lg sm:text-xl font-bold font-mono text-slate-900">
                {card.isCurrency ? formatCurrency(Number(card.value)) : card.value}
              </p>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
};

export default BorrowerStatsCards;
