import React from 'react';
import Card from '@/components/common/Card';
import { formatCurrency } from '@/utils/currency';
import { CapitalBalance } from '@/types/capital';
import { ArrowDownLeft, ArrowUpRight, Landmark, ReceiptText } from 'lucide-react';

interface CapitalBalanceCardsProps {
  balance?: CapitalBalance;
  isLoading?: boolean;
}

export const CapitalBalanceCards: React.FC<CapitalBalanceCardsProps> = ({
  balance,
  isLoading = false,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Given */}
      <Card className="p-5 border-l-4 border-l-emerald-500 shadow-xs hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total Given (Provider → Operator)
          </span>
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
            <ArrowDownLeft className="w-5 h-5" />
          </div>
        </div>
        <p className="text-2xl font-bold text-slate-900 mt-2">
          {isLoading ? '...' : formatCurrency(balance?.totalGiven || 0)}
        </p>
        <p className="text-xs text-slate-500 mt-1">Cumulative funds injected</p>
      </Card>

      {/* 2. Total Returned */}
      <Card className="p-5 border-l-4 border-l-blue-500 shadow-xs hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total Returned (Operator → Provider)
          </span>
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>
        <p className="text-2xl font-bold text-slate-900 mt-2">
          {isLoading ? '...' : formatCurrency(balance?.totalReturned || 0)}
        </p>
        <p className="text-xs text-slate-500 mt-1">Returned capital & draws</p>
      </Card>

      {/* 3. Current Running Balance */}
      <Card className="p-5 border-l-4 border-l-indigo-600 shadow-xs hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Current Capital Balance
          </span>
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
            <Landmark className="w-5 h-5" />
          </div>
        </div>
        <p className="text-2xl font-bold text-indigo-700 mt-2">
          {isLoading ? '...' : formatCurrency(balance?.currentBalance || 0)}
        </p>
        <p className="text-xs text-slate-500 mt-1">Active capital in operations</p>
      </Card>

      {/* 4. Total Transactions Count */}
      <Card className="p-5 border-l-4 border-l-amber-500 shadow-xs hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Transactions
          </span>
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
            <ReceiptText className="w-5 h-5" />
          </div>
        </div>
        <p className="text-2xl font-bold text-slate-900 mt-2">
          {isLoading ? '...' : balance?.transactionCount || 0}
        </p>
        <p className="text-xs text-slate-500 mt-1">Recorded ledger events</p>
      </Card>
    </div>
  );
};

export default CapitalBalanceCards;
