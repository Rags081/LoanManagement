import React from 'react';
import Card from '@/components/common/Card';
import { BorrowerLoanSummary } from '@/types/borrower';
import { formatCurrency } from '@/utils/currency';
import { format } from 'date-fns';
import { Layers } from 'lucide-react';

interface BorrowerLoanHistoryProps {
  loans?: BorrowerLoanSummary[];
  isLoading?: boolean;
}

export const BorrowerLoanHistory: React.FC<BorrowerLoanHistoryProps> = ({
  loans = [],
  isLoading = false,
}) => {
  const getStatusBadge = (status: BorrowerLoanSummary['status']) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Active
          </span>
        );
      case 'overdue':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            Overdue
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            Completed
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  const parseSafeDate = (rawDate: string | undefined): string => {
    if (!rawDate) return '—';
    try {
      if (typeof rawDate === 'string' && /^\d{4}-\d{2}-\d{2}/.test(rawDate)) {
        const [y, m, d] = rawDate.split('T')[0].split('-').map((n) => parseInt(n, 10));
        return format(new Date(y, m - 1, d, 12, 0, 0), 'dd MMM yyyy');
      }
      const d = new Date(rawDate);
      return !isNaN(d.getTime()) ? format(d, 'dd MMM yyyy') : rawDate;
    } catch {
      return String(rawDate).split('T')[0];
    }
  };

  return (
    <Card className="overflow-hidden border border-slate-200">
      <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-primary-600" />
          <h4 className="text-sm font-bold text-slate-900">Associated Loan Records</h4>
        </div>
        <span className="text-xs text-slate-500 font-medium">
          {loans.length} {loans.length === 1 ? 'Loan' : 'Loans'}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-200 text-slate-600 font-semibold text-xs uppercase tracking-wider">
              <th className="py-2.5 px-3">Loan ID</th>
              <th className="py-2.5 px-3 text-right">Principal</th>
              <th className="py-2.5 px-3">Rate / Term</th>
              <th className="py-2.5 px-3">Given Date</th>
              <th className="py-2.5 px-3">Due Date</th>
              <th className="py-2.5 px-3 text-right">Paid / Expected</th>
              <th className="py-2.5 px-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                  Loading borrower loan history...
                </td>
              </tr>
            ) : loans.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                  No loans recorded for this borrower yet.
                </td>
              </tr>
            ) : (
              loans.map((loan) => (
                <tr key={loan.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-2.5 px-3 font-mono font-semibold text-slate-800">
                    {loan.loanId}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                    {formatCurrency(loan.principalAmount)}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 text-xs">
                    {loan.interestRate}% {loan.interestRateType} ({loan.tenure} {loan.tenureUnit})
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 text-xs whitespace-nowrap">
                    {parseSafeDate(loan.loanGivenDate)}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 text-xs whitespace-nowrap">
                    {parseSafeDate(loan.dueDate)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-xs">
                    <span className="font-mono font-bold text-emerald-700">
                      {formatCurrency(loan.totalPaid)}
                    </span>{' '}
                    <span className="text-slate-400">/</span>{' '}
                    <span className="font-mono text-slate-600">
                      {formatCurrency(loan.totalExpectedRepayment)}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">{getStatusBadge(loan.status)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export default BorrowerLoanHistory;
