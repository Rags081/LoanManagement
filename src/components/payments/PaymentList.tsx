import React from 'react';
import { PaymentWithLoan } from '@/types/payment';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/common/Button';
import {
  FileText,
  Printer,
  ShieldAlert,
  CreditCard,
  Building2,
  Smartphone,
  Banknote,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface PaymentListProps {
  payments: PaymentWithLoan[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  isLoading?: boolean;
  onPageChange: (page: number) => void;
  onViewReceipt: (payment: PaymentWithLoan) => void;
  onVoid: (payment: PaymentWithLoan) => void;
}

export const PaymentList: React.FC<PaymentListProps> = ({
  payments,
  total,
  page,
  limit,
  totalPages,
  isLoading = false,
  onPageChange,
  onViewReceipt,
  onVoid,
}) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const renderPaymentModeBadge = (mode: string) => {
    switch (mode) {
      case 'cash':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Banknote className="w-3 h-3" /> Cash
          </span>
        );
      case 'upi':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <Smartphone className="w-3 h-3" /> UPI
          </span>
        );
      case 'bank_transfer':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Building2 className="w-3 h-3" /> Bank Transfer
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <CreditCard className="w-3 h-3" /> Other
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600 border-collapse">
          <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-xs tracking-wider border-b border-slate-200">
            <tr>
              <th className="py-3.5 px-4">Payment Date</th>
              <th className="py-3.5 px-4">Payment ID</th>
              <th className="py-3.5 px-4">Loan Account & Borrower</th>
              <th className="py-3.5 px-4 text-right">Amount Paid</th>
              <th className="py-3.5 px-4">Portion Breakdown</th>
              <th className="py-3.5 px-4">Payment Mode</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={8} className="py-4 px-4">
                    <div className="h-5 bg-slate-100 rounded w-full" />
                  </td>
                </tr>
              ))
            ) : payments.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="font-semibold text-slate-600">No payment transactions found</p>
                  <p className="text-xs text-slate-400 mt-1">Try adjusting your filters or record a new repayment.</p>
                </td>
              </tr>
            ) : (
              payments.map((p) => (
                <tr
                  key={p.id}
                  className={`hover:bg-slate-50/80 transition-colors ${
                    p.isVoid ? 'bg-rose-50/30 opacity-75' : ''
                  }`}
                >
                  {/* Payment Date */}
                  <td className="py-3.5 px-4 whitespace-nowrap font-medium text-slate-900">
                    {formatDate(p.paymentDate)}
                  </td>

                  {/* Payment ID */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <button
                      onClick={() => onViewReceipt(p)}
                      className="inline-flex items-center gap-1 font-mono font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      {p.paymentId}
                    </button>
                    {p.referenceNumber && (
                      <p className="text-[11px] text-slate-400 font-mono">Ref: {p.referenceNumber}</p>
                    )}
                  </td>

                  {/* Loan & Borrower */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="font-bold text-slate-900">{p.borrowerName}</div>
                    <div className="text-xs text-indigo-700 font-mono font-semibold">
                      {p.loanCustomId || `Loan #${p.loanId}`}
                    </div>
                  </td>

                  {/* Amount Paid */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-right font-bold text-slate-900">
                    <span className={p.isVoid ? 'line-through text-slate-400' : 'text-slate-900'}>
                      {formatCurrency(p.paymentAmount)}
                    </span>
                  </td>

                  {/* Breakdown */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-xs">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-emerald-700 font-medium">
                        Interest: {formatCurrency(p.interestPortion)}
                      </span>
                      <span className="text-indigo-700 font-medium">
                        Principal: {formatCurrency(p.principalPortion)}
                      </span>
                    </div>
                  </td>

                  {/* Payment Mode */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {renderPaymentModeBadge(p.paymentMode)}
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {p.isVoid ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                        <ShieldAlert className="w-3 h-3" /> Voided
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        ✓ Paid
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onViewReceipt(p)}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="View & Print Receipt"
                      >
                        <Printer className="w-4 h-4" />
                      </button>

                      {isAdmin && !p.isVoid && (
                        <button
                          onClick={() => onVoid(p)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Void Payment Transaction"
                        >
                          <ShieldAlert className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {!isLoading && payments.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
          <div className="text-xs text-slate-500">
            Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} payments
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              leftIcon={<ChevronLeft className="w-4 h-4" />}
            >
              Previous
            </Button>
            <span className="text-xs font-semibold text-slate-700 px-2">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              rightIcon={<ChevronRight className="w-4 h-4" />}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentList;
