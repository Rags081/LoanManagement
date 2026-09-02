import React from 'react';
import Card from '@/components/common/Card';
import { PaymentSummary } from '@/types/payment';
import { formatCurrency } from '@/utils/formatters';
import { HandCoins, Calendar, CheckCircle2, ShieldAlert } from 'lucide-react';

interface PaymentSummaryCardsProps {
  summary?: PaymentSummary;
  isLoading?: boolean;
}

export const PaymentSummaryCards: React.FC<PaymentSummaryCardsProps> = ({
  summary,
  isLoading = false,
}) => {
  const cards = [
    {
      title: 'Total Collections',
      value: summary ? formatCurrency(summary.totalCollected) : '₹0',
      subtitle: `${summary?.totalPayments || 0} Successful Repayments`,
      icon: <HandCoins className="w-5 h-5 text-emerald-600" />,
      bg: 'bg-emerald-50 border-emerald-100',
    },
    {
      title: 'Collected This Month',
      value: summary ? formatCurrency(summary.collectedThisMonth) : '₹0',
      subtitle: 'Current billing calendar cycle',
      icon: <Calendar className="w-5 h-5 text-indigo-600" />,
      bg: 'bg-indigo-50 border-indigo-100',
    },
    {
      title: 'Principal Recovered',
      value: summary ? formatCurrency(summary.principalCollected) : '₹0',
      subtitle: `Interest: ${summary ? formatCurrency(summary.interestCollected) : '₹0'}`,
      icon: <CheckCircle2 className="w-5 h-5 text-blue-600" />,
      bg: 'bg-blue-50 border-blue-100',
    },
    {
      title: 'Voided Collections',
      value: summary ? formatCurrency(summary.voidedAmount) : '₹0',
      subtitle: `${summary?.voidedPaymentsCount || 0} Cancelled Entries`,
      icon: <ShieldAlert className="w-5 h-5 text-rose-600" />,
      bg: 'bg-rose-50 border-rose-100',
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

export default PaymentSummaryCards;
