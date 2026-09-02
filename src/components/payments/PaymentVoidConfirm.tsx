import React, { useState } from 'react';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import TextArea from '@/components/common/Form/TextArea';
import { PaymentWithLoan } from '@/types/payment';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { AlertTriangle, ShieldAlert } from 'lucide-react';

interface PaymentVoidConfirmProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (voidReason: string) => Promise<void> | void;
  payment: PaymentWithLoan | null;
  isLoading?: boolean;
}

export const PaymentVoidConfirm: React.FC<PaymentVoidConfirmProps> = ({
  isOpen,
  onClose,
  onConfirm,
  payment,
  isLoading = false,
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!payment) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Please provide a valid reason for voiding this payment.');
      return;
    }
    setError(null);
    await onConfirm(reason.trim());
    setReason('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Void Payment Transaction"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Warning Banner */}
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-xs text-rose-900 space-y-1">
            <p className="font-bold text-rose-950">Warning: Voiding Reverses Financial Balances</p>
            <p>
              Voiding payment <span className="font-mono font-bold">{payment.paymentId}</span> will reverse{' '}
              <span className="font-bold">{formatCurrency(payment.paymentAmount)}</span> from loan{' '}
              <span className="font-mono font-bold">{payment.loanCustomId}</span> and restore the borrower&apos;s outstanding balance.
            </p>
          </div>
        </div>

        {/* Payment Summary */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">Payment ID:</span>
            <span className="font-mono font-bold text-slate-900">{payment.paymentId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">Borrower:</span>
            <span className="font-bold text-slate-900">{payment.borrowerName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">Payment Date:</span>
            <span className="text-slate-900">{formatDate(payment.paymentDate)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">Payment Amount:</span>
            <span className="font-bold text-rose-700">{formatCurrency(payment.paymentAmount)}</span>
          </div>
          <div className="flex justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200">
            <span>Allocation:</span>
            <span>
              Principal: {formatCurrency(payment.principalPortion)} | Interest: {formatCurrency(payment.interestPortion)}
            </span>
          </div>
        </div>

        {/* Mandatory Void Reason */}
        <TextArea
          label="Reason for Voiding *"
          rows={3}
          placeholder="e.g. Transaction bounced, wrong loan selected, duplicate payment entry..."
          value={reason}
          onChange={(e) => {
            setReason(e.target.value);
            if (error) setError(null);
          }}
          error={error || undefined}
          required
        />

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <Button variant="outline" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button
            variant="danger"
            type="submit"
            isLoading={isLoading}
            leftIcon={<ShieldAlert className="w-4 h-4" />}
          >
            Confirm & Void Payment
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default PaymentVoidConfirm;
