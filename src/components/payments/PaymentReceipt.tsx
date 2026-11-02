import React from 'react';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import { PaymentWithLoan } from '@/types/payment';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { APP_NAME } from '@/utils/constants';
import { Printer, CheckCircle2, ShieldAlert, Building2, User, FileText } from 'lucide-react';

interface PaymentReceiptProps {
  isOpen: boolean;
  onClose: () => void;
  payment: PaymentWithLoan | null;
}

export const PaymentReceipt: React.FC<PaymentReceiptProps> = ({
  isOpen,
  onClose,
  payment,
}) => {
  if (!payment) return null;

  const handlePrint = () => {
    window.print();
  };

  const modeLabels: Record<string, string> = {
    cash: 'Cash Payment',
    upi: 'UPI / Digital Transfer',
    bank_transfer: 'Direct Bank Transfer',
    other: 'Other Method / Cheque',
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Payment Receipt"
      size="lg"
    >
      <div className="space-y-6">
        {/* Printable Receipt Container */}
        <div id="printable-payment-receipt" className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-6 text-slate-800 print:border-none print:shadow-none print:p-0">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-indigo-600 text-white shadow-md">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tight text-slate-900">{APP_NAME.toUpperCase()}</h2>
                <p className="text-xs text-slate-500 font-medium">Official Repayment Receipt & Ledger Entry</p>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-mono font-bold">
                <FileText className="w-3.5 h-3.5 text-indigo-600" /> {payment.paymentId}
              </div>
              <p className="text-xs text-slate-500 mt-1">Receipt Date: {formatDate(payment.paymentDate)}</p>
            </div>
          </div>

          {/* Status Alert if Voided */}
          {payment.isVoid && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 font-bold">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
              THIS TRANSACTION IS VOIDED — Reason: {payment.voidReason || 'Transaction cancelled'}
            </div>
          )}

          {/* Two Column Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs">
            {/* Borrower Details */}
            <div className="space-y-1.5">
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Received From (Borrower)</p>
              <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-indigo-600" /> {payment.borrowerName}
              </p>
              {payment.borrowerPhone && (
                <p className="text-slate-600">Phone: <span className="font-mono">{payment.borrowerPhone}</span></p>
              )}
              {payment.borrowerIdCode && (
                <p className="text-slate-600">Borrower ID: <span className="font-mono">{payment.borrowerIdCode}</span></p>
              )}
            </div>

            {/* Loan Reference Details */}
            <div className="space-y-1.5 sm:border-l sm:border-slate-200 sm:pl-4">
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Loan Account</p>
              <p className="text-sm font-bold text-indigo-950 font-mono">
                {payment.loanCustomId || `Loan #${payment.loanId}`}
              </p>
              <p className="text-slate-600">
                Payment Mode:{' '}
                <span className="font-semibold text-slate-800">
                  {modeLabels[payment.paymentMode] || payment.paymentMode}
                </span>
              </p>
              {payment.referenceNumber && (
                <p className="text-slate-600">
                  Ref / UTR: <span className="font-mono font-bold text-slate-900">{payment.referenceNumber}</span>
                </p>
              )}
            </div>
          </div>

          {/* Allocation Breakdown Table */}
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-4">Description</th>
                  <th className="py-2.5 px-4 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                <tr>
                  <td className="py-3 px-4 font-medium">Interest Portion Cleared</td>
                  <td className="py-3 px-4 text-right font-semibold text-emerald-700">
                    {formatCurrency(payment.interestPortion)}
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium">Principal Reduction</td>
                  <td className="py-3 px-4 text-right font-semibold text-indigo-700">
                    {formatCurrency(payment.principalPortion)}
                  </td>
                </tr>
                <tr className="bg-slate-50/80 font-bold text-sm text-slate-900">
                  <td className="py-3 px-4">Total Amount Received</td>
                  <td className="py-3 px-4 text-right font-black text-indigo-900">
                    {formatCurrency(payment.paymentAmount)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Notes & Verification */}
          {payment.notes && (
            <div className="p-3 rounded-xl bg-slate-50 text-xs text-slate-600 border border-slate-100">
              <span className="font-bold text-slate-800">Remarks: </span>
              {payment.notes}
            </div>
          )}

          {/* Footer & Signature lines */}
          <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-end justify-between gap-6 text-[11px] text-slate-500">
            <div>
              <p className="flex items-center gap-1.5 font-semibold text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5" /> Verified Computer Generated Receipt
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">Recorded by: {payment.creatorName || 'System Admin'}</p>
            </div>

            <div className="text-center sm:text-right border-t border-slate-300 pt-2 min-w-[160px]">
              <p className="font-bold text-slate-800">Authorized Signatory</p>
              <p className="text-[10px] text-slate-400">{APP_NAME}</p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex justify-between items-center pt-2">
          <Button variant="outline" onClick={onClose} type="button">
            Close
          </Button>

          <Button
            variant="primary"
            onClick={handlePrint}
            leftIcon={<Printer className="w-4 h-4" />}
          >
            Print Receipt
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default PaymentReceipt;
