import React from 'react';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import { CapitalTransaction, CapitalTransactionType } from '@/types/capital';
import { formatCurrency } from '@/utils/currency';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { Edit2, Trash2, ArrowDownLeft, ArrowUpRight, SlidersHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';

interface CapitalTransactionListProps {
  transactions: CapitalTransaction[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onEdit: (transaction: CapitalTransaction) => void;
  onDelete: (id: number) => void;
  isLoading?: boolean;
}

export const CapitalTransactionList: React.FC<CapitalTransactionListProps> = ({
  transactions,
  total,
  page,
  limit,
  totalPages,
  onPageChange,
  onEdit,
  onDelete,
  isLoading = false,
}) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const getTypeBadge = (type: CapitalTransactionType) => {
    switch (type) {
      case 'capital_given':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
            Capital Given
          </span>
        );
      case 'capital_returned':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <ArrowUpRight className="w-3.5 h-3.5 text-blue-600" />
            Capital Returned
          </span>
        );
      case 'adjustment':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <SlidersHorizontal className="w-3.5 h-3.5 text-amber-600" />
            Adjustment
          </span>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <Card className="p-8 text-center text-slate-400 text-sm">
        Loading capital transactions ledger...
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border border-slate-200 shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs uppercase tracking-wider">
              <th className="py-3 px-4">Tx ID</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Type</th>
              <th className="py-3 px-4 text-right">Amount</th>
              <th className="py-3 px-4">Flow (Source → Dest)</th>
              <th className="py-3 px-4 text-right">Running Balance</th>
              <th className="py-3 px-4">Recorded By</th>
              {isAdmin && <th className="py-3 px-4 text-center">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 8 : 7} className="py-12 text-center text-slate-400 text-sm">
                  No capital transactions found. Click "Add Transaction" to record one.
                </td>
              </tr>
            ) : (
              transactions.map((tx) => {
                const rawDate = tx.transactionDate || (tx as unknown as { transaction_date?: string }).transaction_date;
                let formattedDate = '—';
                if (rawDate) {
                  try {
                    if (typeof rawDate === 'string' && /^\d{4}-\d{2}-\d{2}/.test(rawDate)) {
                      const cleanStr = rawDate.split('T')[0].split(' ')[0];
                      const [y, m, d] = cleanStr.split('-').map((num) => parseInt(num, 10));
                      formattedDate = format(new Date(y, m - 1, d, 12, 0, 0), 'dd MMM yyyy');
                    } else {
                      const d = new Date(rawDate);
                      if (!isNaN(d.getTime())) {
                        formattedDate = format(d, 'dd MMM yyyy');
                      }
                    }
                  } catch {
                    formattedDate = String(rawDate).split('T')[0];
                  }
                }

                const txId = tx.transactionId || (tx as unknown as { transaction_id?: string }).transaction_id || `CAP-${tx.id}`;
                const txType = (tx.transactionType || (tx as unknown as { transaction_type?: CapitalTransactionType }).transaction_type || 'capital_given') as CapitalTransactionType;
                const runningBal = tx.runningBalance !== undefined ? tx.runningBalance : (tx as unknown as { running_balance?: number }).running_balance || 0;
                const creator = tx.creatorName || (tx as unknown as { creator_name?: string }).creator_name || 'System Admin';
                const refNum = tx.referenceNumber || (tx as unknown as { reference_number?: string }).reference_number;

                return (
                  <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-800">
                      {txId}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                      {formattedDate}
                    </td>
                    <td className="py-3.5 px-4">{getTypeBadge(txType)}</td>
                    <td
                      className={`py-3.5 px-4 text-right font-bold whitespace-nowrap ${
                        txType === 'capital_given'
                          ? 'text-emerald-700'
                          : txType === 'capital_returned'
                          ? 'text-blue-700'
                          : 'text-amber-700'
                      }`}
                    >
                      {txType === 'capital_given' ? '+' : txType === 'capital_returned' ? '-' : ''}
                      {formatCurrency(tx.amount)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 text-xs">
                      {tx.source || tx.destination ? (
                        <span>
                          {tx.source || 'Direct'} → {tx.destination || 'Operator Pool'}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                      {refNum && (
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">Ref: {refNum}</p>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                      {formatCurrency(runningBal)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 text-xs whitespace-nowrap">
                      {creator}
                    </td>
                    {isAdmin && (
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onEdit(tx)}
                            title="Edit transaction"
                            className="p-1.5 text-slate-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDelete(tx.id)}
                            title="Delete transaction"
                            className="p-1.5 text-slate-500 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-600">
          <div>
            Showing <span className="font-semibold">{Math.min((page - 1) * limit + 1, total)}</span> to{' '}
            <span className="font-semibold">{Math.min(page * limit, total)}</span> of{' '}
            <span className="font-semibold">{total}</span> transactions
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="px-3 py-1 text-xs font-semibold text-slate-700">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};

export default CapitalTransactionList;
