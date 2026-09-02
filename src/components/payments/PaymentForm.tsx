import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import Input from '@/components/common/Form/Input';
import Select from '@/components/common/Form/Select';
import TextArea from '@/components/common/Form/TextArea';
import { paymentSchema, PaymentSchemaType } from '@/utils/validation';
import { AllocationMethod } from '@/types/payment';
import { useLoanList, useLoanOutstanding } from '@/hooks/useLoans';
import { LoanWithBorrower } from '@/types/loan';
import { PaymentAllocationPreview } from './PaymentAllocationPreview';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { Calendar, CreditCard, Hash, HandCoins, User } from 'lucide-react';

interface PaymentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PaymentSchemaType) => Promise<void> | void;
  defaultLoan?: LoanWithBorrower | null;
  isLoading?: boolean;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  defaultLoan,
  isLoading = false,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  const [selectedLoanId, setSelectedLoanId] = useState<number>(defaultLoan?.id || 0);

  // Fetch active loans for selection
  const { data: activeLoansData } = useLoanList({ status: 'active', limit: 100 });
  const activeLoans = activeLoansData?.data || [];

  // Fetch detailed live outstanding of selected loan
  const { data: outstandingData } = useLoanOutstanding(selectedLoanId || undefined);

  const selectedLoan = activeLoans.find((l) => l.id === selectedLoanId) || defaultLoan;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<PaymentSchemaType>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      loanId: defaultLoan?.id || 0,
      paymentDate: todayStr,
      paymentAmount: 0,
      paymentMode: 'cash',
      allocationMethod: 'interest_first',
      referenceNumber: '',
      notes: '',
    },
  });

  const paymentAmount = watch('paymentAmount') || 0;
  const allocationMethod = (watch('allocationMethod') || 'interest_first') as AllocationMethod;

  useEffect(() => {
    if (isOpen) {
      if (defaultLoan) {
        setSelectedLoanId(defaultLoan.id);
        reset({
          loanId: defaultLoan.id,
          paymentDate: todayStr,
          paymentAmount: defaultLoan.totalOutstanding || 0,
          paymentMode: 'cash',
          allocationMethod: 'interest_first',
          referenceNumber: '',
          notes: '',
        });
      } else {
        setSelectedLoanId(0);
        reset({
          loanId: 0,
          paymentDate: todayStr,
          paymentAmount: 0,
          paymentMode: 'cash',
          allocationMethod: 'interest_first',
          referenceNumber: '',
          notes: '',
        });
      }
    }
  }, [isOpen, defaultLoan, reset, todayStr]);

  const handleLoanChange = (loanId: number) => {
    setSelectedLoanId(loanId);
    setValue('loanId', loanId, { shouldValidate: true });

    const matched = activeLoans.find((l) => l.id === loanId);
    if (matched && matched.totalOutstanding) {
      setValue('paymentAmount', matched.totalOutstanding, { shouldValidate: true });
    }
  };

  const princOutstanding = outstandingData?.principalOutstanding !== undefined
    ? outstandingData.principalOutstanding
    : (selectedLoan?.principalOutstanding ?? selectedLoan?.principalAmount ?? 0);

  const intOutstanding = outstandingData?.interestOutstanding !== undefined
    ? outstandingData.interestOutstanding
    : (selectedLoan?.interestOutstanding ?? 0);

  const totalOutstanding = outstandingData?.totalOutstanding !== undefined
    ? outstandingData.totalOutstanding
    : (selectedLoan?.totalOutstanding ?? princOutstanding + intOutstanding);

  const handleFormSubmit = async (data: PaymentSchemaType) => {
    await onSubmit(data);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Loan Repayment"
      size="lg"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        {/* Loan Selection */}
        {!defaultLoan ? (
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Select Loan <span className="text-rose-500">*</span>
            </label>
            <select
              className="w-full h-10 px-3 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-slate-900"
              value={selectedLoanId}
              onChange={(e) => handleLoanChange(Number(e.target.value))}
            >
              <option value="0">-- Select Active Loan --</option>
              {activeLoans.map((loan) => (
                <option key={loan.id} value={loan.id}>
                  {loan.loanId} — {loan.borrowerName} ({loan.borrowerPhone}) — Outstanding: {formatCurrency(loan.totalOutstanding || loan.principalAmount)}
                </option>
              ))}
            </select>
            {errors.loanId && (
              <p className="text-xs text-rose-500 font-semibold">{errors.loanId.message}</p>
            )}
          </div>
        ) : (
          <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-600 text-white font-bold text-xs font-mono">
                {defaultLoan.loanId}
              </div>
              <div>
                <p className="text-sm font-bold text-indigo-950 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-600" /> {defaultLoan.borrowerName}
                </p>
                <p className="text-xs text-indigo-700">Disbursed on {formatDate(defaultLoan.loanGivenDate)}</p>
              </div>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
              Active
            </span>
          </div>
        )}

        {/* Selected Loan Balance Overview Card */}
        {selectedLoanId > 0 && (
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <p className="text-[10px] uppercase font-semibold text-slate-500">Principal Bal</p>
              <p className="text-sm font-bold text-slate-800 mt-0.5">{formatCurrency(princOutstanding)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-semibold text-slate-500">Accrued Interest</p>
              <p className="text-sm font-bold text-slate-800 mt-0.5">{formatCurrency(intOutstanding)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-semibold text-indigo-700">Total Outstanding</p>
              <p className="text-sm font-black text-indigo-950 mt-0.5">{formatCurrency(totalOutstanding)}</p>
            </div>
          </div>
        )}

        {/* Payment Amount & Quick Actions */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Payment Amount (₹) <span className="text-rose-500">*</span>
            </label>
            {selectedLoanId > 0 && (
              <div className="flex gap-1.5">
                {intOutstanding > 0 && (
                  <button
                    type="button"
                    onClick={() => setValue('paymentAmount', intOutstanding, { shouldValidate: true })}
                    className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                  >
                    Pay Interest ({formatCurrency(intOutstanding)})
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setValue('paymentAmount', totalOutstanding, { shouldValidate: true })}
                  className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-800 hover:underline"
                >
                  Pay Full ({formatCurrency(totalOutstanding)})
                </button>
              </div>
            )}
          </div>

          <Input
            type="number"
            step="0.01"
            placeholder="e.g. 15000"
            leftIcon={<HandCoins className="w-4 h-4 text-slate-400" />}
            error={errors.paymentAmount?.message}
            {...register('paymentAmount', { valueAsNumber: true })}
            required
          />
        </div>

        {/* Payment Date & Mode */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Payment Date"
            type="date"
            leftIcon={<Calendar className="w-4 h-4 text-slate-400" />}
            error={errors.paymentDate?.message}
            {...register('paymentDate')}
            required
          />

          <Select
            label="Payment Mode"
            options={[
              { value: 'cash', label: 'Cash Payment' },
              { value: 'upi', label: 'UPI / QR Transfer (GPay, PhonePe, Paytm)' },
              { value: 'bank_transfer', label: 'Bank Account Transfer (NEFT/IMPS)' },
              { value: 'other', label: 'Other / Cheque' },
            ]}
            error={errors.paymentMode?.message}
            {...register('paymentMode')}
          />
        </div>

        {/* Allocation Strategy & Reference Number */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Allocation Strategy"
            options={[
              { value: 'interest_first', label: 'Interest First (Standard — Clears interest, then principal)' },
              { value: 'principal_first', label: 'Principal First (Reduces principal, then interest)' },
              { value: 'proportional', label: 'Proportional (Split based on balance ratio)' },
            ]}
            error={errors.allocationMethod?.message}
            {...register('allocationMethod')}
          />

          <Input
            label="Reference / UTR Number (Optional)"
            placeholder="e.g. UPI-987654321 or CHQ-00123"
            leftIcon={<Hash className="w-4 h-4 text-slate-400" />}
            error={errors.referenceNumber?.message}
            {...register('referenceNumber')}
          />
        </div>

        {/* Live Allocation Preview Banner */}
        {selectedLoanId > 0 && Number(paymentAmount) > 0 && (
          <PaymentAllocationPreview
            amount={Number(paymentAmount)}
            principalOutstanding={princOutstanding}
            interestOutstanding={intOutstanding}
            allocationMethod={allocationMethod}
          />
        )}

        {/* Notes */}
        <TextArea
          label="Payment Notes (Optional)"
          rows={2}
          placeholder="Add any receipt remarks, payer remarks, or transaction details..."
          error={errors.notes?.message}
          {...register('notes')}
        />

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <Button variant="outline" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="primary" type="submit" isLoading={isLoading} leftIcon={<CreditCard className="w-4 h-4" />}>
            Record Payment
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default PaymentForm;
