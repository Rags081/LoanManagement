import React from 'react';
import Card from '@/components/common/Card';
import { LoanOutstanding } from '@/types/loan';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { CheckCircle2, TrendingUp, Wallet, ShieldAlert, Hourglass } from 'lucide-react';

interface LoanOutstandingCardProps {
  outstanding?: LoanOutstanding | null;
  isLoading?: boolean;
}

export const LoanOutstandingCard: React.FC<LoanOutstandingCardProps> = ({
  outstanding,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-200 rounded w-1/3" />
          <div className="grid grid-cols-3 gap-4">
            <div className="h-16 bg-slate-200 rounded" />
            <div className="h-16 bg-slate-200 rounded" />
            <div className="h-16 bg-slate-200 rounded" />
          </div>
        </div>
      </Card>
    );
  }

  if (!outstanding) return null;

  const totalExpected = outstanding.totalExpected || 1;
  const progressPercent = Math.min(
    100,
    Math.max(0, Math.round((outstanding.totalReceived / totalExpected) * 100))
  );

  return (
    <Card className="p-6 border border-slate-200 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-indigo-600" /> Outstanding Balance & Ledger
          </h3>
          <p className="text-xs text-slate-500">Live dynamic principal & interest reconciliation</p>
        </div>

        {outstanding.isOverdue ? (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
            <ShieldAlert className="w-4 h-4 text-rose-600" />
            OVERDUE BY {outstanding.daysOverdue} DAY{outstanding.daysOverdue === 1 ? '' : 'S'}
          </div>
        ) : progressPercent >= 100 ? (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> FULLY REPAID
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold">
            <TrendingUp className="w-4 h-4 text-indigo-600" /> {progressPercent}% Repaid
          </div>
        )}
      </div>

      {/* Elapsed Tenure Duration Banner */}
      <div className="p-3.5 rounded-xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-indigo-600/80 text-white">
            {outstanding.isCompleted ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            ) : (
              <Hourglass className="w-4 h-4 text-indigo-200 animate-spin" />
            )}
          </div>
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
              {outstanding.isCompleted ? 'Final Settled Tenure Duration' : 'Tenure Elapsed So Far'}
            </span>
            <span className="text-sm font-bold text-white">
              {outstanding.elapsedTenure || `${outstanding.elapsedDays} Days`}
            </span>
          </div>
        </div>

        <div className="text-right sm:border-l sm:border-slate-800 sm:pl-4">
          <span className="text-[10px] text-slate-400 block">
            {outstanding.isCompleted ? 'Settlement Date' : 'Status'}
          </span>
          <span className="text-xs font-mono font-semibold text-indigo-300">
            {outstanding.isCompleted && outstanding.settlementDate
              ? formatDate(outstanding.settlementDate)
              : 'Ongoing until fully paid'}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-medium text-slate-600">
          <span>Repayment Progress</span>
          <span className="font-bold text-slate-900">{progressPercent}%</span>
        </div>
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              progressPercent >= 100
                ? 'bg-emerald-500'
                : outstanding.isOverdue
                ? 'bg-rose-500'
                : 'bg-indigo-600'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Principal Box */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Principal</p>
          <div className="flex justify-between items-baseline">
            <span className="text-xs text-slate-500">Borrowed:</span>
            <span className="text-sm font-semibold text-slate-800">{formatCurrency(outstanding.principalAmount)}</span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-xs text-slate-500">Repaid:</span>
            <span className="text-sm font-semibold text-emerald-600">-{formatCurrency(outstanding.principalReceived)}</span>
          </div>
          <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
            <span className="text-xs font-bold text-slate-700">Outstanding:</span>
            <span className="text-base font-bold text-slate-900">{formatCurrency(outstanding.principalOutstanding)}</span>
          </div>
        </div>

        {/* Interest Box */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Interest</p>
          <div className="flex justify-between items-baseline">
            <span className="text-xs text-slate-500">Expected:</span>
            <span className="text-sm font-semibold text-slate-800">{formatCurrency(outstanding.interestExpected)}</span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-xs text-slate-500">Received:</span>
            <span className="text-sm font-semibold text-emerald-600">-{formatCurrency(outstanding.interestReceived)}</span>
          </div>
          <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
            <span className="text-xs font-bold text-slate-700">Outstanding:</span>
            <span className="text-base font-bold text-slate-900">{formatCurrency(outstanding.interestOutstanding)}</span>
          </div>
        </div>

        {/* Total Box */}
        <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-100 space-y-2">
          <p className="text-xs font-bold text-indigo-900 uppercase tracking-wider">Total Repayment</p>
          <div className="flex justify-between items-baseline">
            <span className="text-xs text-indigo-700">Total Expected:</span>
            <span className="text-sm font-semibold text-indigo-900">{formatCurrency(outstanding.totalExpected)}</span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-xs text-indigo-700">Total Collected:</span>
            <span className="text-sm font-semibold text-emerald-700">-{formatCurrency(outstanding.totalReceived)}</span>
          </div>
          <div className="pt-2 border-t border-indigo-200 flex justify-between items-baseline">
            <span className="text-xs font-bold text-indigo-950">Net Outstanding:</span>
            <span className="text-lg font-black text-indigo-950">{formatCurrency(outstanding.totalOutstanding)}</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default LoanOutstandingCard;
