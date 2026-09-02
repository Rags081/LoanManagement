import React, { useEffect, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import Input from '@/components/common/Form/Input';
import Select from '@/components/common/Form/Select';
import TextArea from '@/components/common/Form/TextArea';
import { loanSchema, LoanSchemaType } from '@/utils/validation';
import { LoanWithBorrower, InterestRateType } from '@/types/loan';
import { BorrowerSearch } from '@/components/borrowers/BorrowerSearch';
import { Borrower } from '@/types/borrower';
import { formatCurrency } from '@/utils/formatters';
import Decimal from 'decimal.js';
import { Calendar, User, Percent, Info, Sparkles } from 'lucide-react';

interface LoanFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: LoanSchemaType) => Promise<void> | void;
  initialData?: LoanWithBorrower | null;
  isLoading?: boolean;
}

export const LoanForm: React.FC<LoanFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading = false,
}) => {
  const isEdit = !!initialData;
  const [selectedBorrower, setSelectedBorrower] = useState<Borrower | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<LoanSchemaType>({
    resolver: zodResolver(loanSchema),
    defaultValues: {
      borrowerId: initialData?.borrowerId || 0,
      principalAmount: initialData?.principalAmount || 50000,
      interestRate: initialData?.interestRate || 3,
      interestRateType: (initialData?.interestRateType as InterestRateType) || 'monthly',
      loanGivenDate: initialData?.loanGivenDate || todayStr,
      notes: initialData?.notes || '',
    },
  });

  const principal = watch('principalAmount') || 0;
  const rate = watch('interestRate') || 0;
  const rateType = (watch('interestRateType') || 'monthly') as InterestRateType;

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        reset({
          borrowerId: initialData.borrowerId,
          principalAmount: initialData.principalAmount,
          interestRate: initialData.interestRate,
          interestRateType: initialData.interestRateType,
          loanGivenDate: initialData.loanGivenDate,
          notes: initialData.notes || '',
        });

        if (initialData.borrower) {
          setSelectedBorrower(initialData.borrower);
        } else if (initialData.borrowerName) {
          setSelectedBorrower({
            id: initialData.borrowerId,
            borrowerId: initialData.borrowerIdCode || `BOR-${initialData.borrowerId}`,
            fullName: initialData.borrowerName,
            phone: initialData.borrowerPhone || '',
            status: 'active',
            createdBy: initialData.createdBy,
            createdAt: initialData.createdAt,
            updatedAt: initialData.updatedAt,
          });
        }
      } else {
        reset({
          borrowerId: 0,
          principalAmount: 50000,
          interestRate: 3,
          interestRateType: 'monthly',
          loanGivenDate: todayStr,
          notes: '',
        });
        setSelectedBorrower(null);
      }
    }
  }, [isOpen, initialData, reset, todayStr]);

  // Method-aware live interest calculations
  const { monthlyRateAmount, dailyRateAmount } = useMemo(() => {
    try {
      Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });
      const p = new Decimal(principal || 0);
      const r = new Decimal(rate || 0).dividedBy(100);

      let monthly = new Decimal(0);
      let daily = new Decimal(0);

      if (rateType === 'daily') {
        daily = p.times(r.dividedBy(30));
        monthly = daily.times(30);
      } else {
        monthly = p.times(r);
        daily = monthly.dividedBy(30);
      }

      return {
        monthlyRateAmount: monthly.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber(),
        dailyRateAmount: daily.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber(),
      };
    } catch {
      return { monthlyRateAmount: 0, dailyRateAmount: 0 };
    }
  }, [principal, rate, rateType]);

  const handleFormSubmit = async (data: LoanSchemaType) => {
    await onSubmit(data);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? `Edit Loan (${initialData?.loanId})` : 'Disburse New Loan'}
      size="lg"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        {/* Borrower Selection */}
        {!isEdit && (
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Select Borrower <span className="text-rose-500">*</span>
            </label>
            <BorrowerSearch
              onSelect={(b) => {
                if (b) {
                  setSelectedBorrower(b);
                  setValue('borrowerId', b.id, { shouldValidate: true });
                }
              }}
              placeholder="Search by Borrower name, phone, or BOR ID..."
            />
            {selectedBorrower && (
              <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-indigo-600 text-white font-bold text-xs">
                    {selectedBorrower.borrowerId}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-indigo-950">{selectedBorrower.fullName}</p>
                    <p className="text-xs text-indigo-700">{selectedBorrower.phone}</p>
                  </div>
                </div>
                <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {selectedBorrower.status}
                </span>
              </div>
            )}
            {errors.borrowerId && (
              <p className="text-xs text-rose-500 font-semibold">{errors.borrowerId.message}</p>
            )}
          </div>
        )}

        {isEdit && selectedBorrower && (
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2.5">
            <User className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-semibold text-slate-800">
              Borrower: {selectedBorrower.fullName} ({selectedBorrower.borrowerId})
            </span>
          </div>
        )}

        {/* Principal Amount & Loan Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Principal Amount (₹)"
            type="number"
            placeholder="e.g. 50000"
            error={errors.principalAmount?.message}
            {...register('principalAmount', { valueAsNumber: true })}
            required
          />

          <Input
            label="Loan Date"
            type="date"
            leftIcon={<Calendar className="w-4 h-4 text-slate-400" />}
            error={errors.loanGivenDate?.message}
            {...register('loanGivenDate')}
            required
          />
        </div>

        {/* Interest Rate & Method */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Interest Rate (%)"
            type="number"
            step="0.01"
            placeholder="e.g. 3.0"
            leftIcon={<Percent className="w-4 h-4 text-slate-400" />}
            error={errors.interestRate?.message}
            {...register('interestRate', { valueAsNumber: true })}
            required
          />

          <Select
            label="Calculation Method"
            options={[
              { value: 'monthly', label: 'Monthly Standard (Simple % per month)' },
              { value: 'daily', label: 'Daily (Pro-rated per day)' },
              { value: 'flat', label: 'Flat Interest Rate' },
            ]}
            error={errors.interestRateType?.message}
            {...register('interestRateType')}
          />
        </div>

        {/* Method-Aware Loan Terms & Interest Summary Banner */}
        <div className="p-4 rounded-xl bg-slate-900 text-white space-y-3 shadow-inner">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Loan Terms & Interest Summary
            </span>
            <span className="text-xs text-emerald-400 font-medium">
              Open-Ended Tenure
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 rounded-lg bg-slate-800/80">
              <p className="text-[10px] uppercase font-semibold text-slate-400">Principal Disbursed</p>
              <p className="text-sm font-bold text-white mt-0.5">{formatCurrency(principal)}</p>
            </div>

            {rateType === 'daily' ? (
              <>
                <div className="p-2.5 rounded-lg bg-slate-800/80">
                  <p className="text-[10px] uppercase font-semibold text-emerald-400">Daily Interest</p>
                  <p className="text-sm font-bold text-emerald-400 mt-0.5">{formatCurrency(dailyRateAmount)} / day</p>
                  <p className="text-[9px] text-slate-400 mt-0.5">30d Equiv: {formatCurrency(monthlyRateAmount)}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-indigo-950/80 border border-indigo-800/50">
                  <p className="text-[10px] uppercase font-semibold text-indigo-300">Daily Rate Basis</p>
                  <p className="text-sm font-bold text-indigo-200 mt-0.5">{rate}% / day</p>
                  <p className="text-[9px] text-indigo-300/80 mt-0.5">Pro-rated daily</p>
                </div>
              </>
            ) : (
              <>
                <div className="p-2.5 rounded-lg bg-slate-800/80">
                  <p className="text-[10px] uppercase font-semibold text-emerald-400">Monthly Interest</p>
                  <p className="text-sm font-bold text-emerald-400 mt-0.5">{formatCurrency(monthlyRateAmount)} / mo</p>
                  <p className="text-[9px] text-slate-400 mt-0.5">Daily Equiv: ~{formatCurrency(dailyRateAmount)}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-indigo-950/80 border border-indigo-800/50">
                  <p className="text-[10px] uppercase font-semibold text-indigo-300">Rate Terms</p>
                  <p className="text-sm font-bold text-indigo-200 mt-0.5">{rate}% / month</p>
                  <p className="text-[9px] text-indigo-300/80 mt-0.5">{rateType}</p>
                </div>
              </>
            )}
          </div>

          <div className="pt-1 flex items-center gap-1.5 text-[11px] text-slate-400">
            <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>Loan remains active until fully settled. Actual calendar tenure is tracked live to current date.</span>
          </div>
        </div>

        {/* Notes */}
        <TextArea
          label="Internal Notes / Collateral Details (Optional)"
          rows={2}
          placeholder="Add any specific conditions, guarantee, or collateral notes..."
          error={errors.notes?.message}
          {...register('notes')}
        />

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <Button variant="outline" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="primary" type="submit" isLoading={isLoading}>
            {isEdit ? 'Save Changes' : 'Disburse Loan'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default LoanForm;
