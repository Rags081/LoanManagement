import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import Input from '@/components/common/Form/Input';
import Select from '@/components/common/Form/Select';
import { CapitalTransaction, CapitalCreate } from '@/types/capital';
import { capitalSchema, CapitalSchemaType } from '@/utils/validation';
import { format } from 'date-fns';

interface CapitalTransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CapitalCreate) => Promise<void>;
  initialData?: CapitalTransaction | null;
  isLoading?: boolean;
}

export const CapitalTransactionForm: React.FC<CapitalTransactionFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading = false,
}) => {
  const isEditing = !!initialData;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CapitalSchemaType>({
    resolver: zodResolver(capitalSchema),
    defaultValues: {
      transactionDate: format(new Date(), 'yyyy-MM-dd'),
      transactionType: 'capital_given',
      amount: '',
      source: '',
      destination: '',
      description: '',
      referenceNumber: '',
      notes: '',
    },
  });

  useEffect(() => {
    if (initialData) {
      const formattedDate =
        typeof initialData.transactionDate === 'string'
          ? initialData.transactionDate.split('T')[0]
          : format(new Date(initialData.transactionDate), 'yyyy-MM-dd');

      reset({
        transactionDate: formattedDate,
        transactionType: initialData.transactionType,
        amount: String(initialData.amount),
        source: initialData.source || '',
        destination: initialData.destination || '',
        description: initialData.description || '',
        referenceNumber: initialData.referenceNumber || '',
        notes: initialData.notes || '',
      });
    } else {
      reset({
        transactionDate: format(new Date(), 'yyyy-MM-dd'),
        transactionType: 'capital_given',
        amount: '',
        source: '',
        destination: '',
        description: '',
        referenceNumber: '',
        notes: '',
      });
    }
  }, [initialData, reset, isOpen]);

  const onFormSubmit = async (values: CapitalSchemaType) => {
    await onSubmit({
      ...values,
      amount: Number(values.amount),
    });
    onClose();
  };

  const typeOptions = [
    { value: 'capital_given', label: 'Capital Given (Provider → Operator)' },
    { value: 'capital_returned', label: 'Capital Returned (Operator → Provider)' },
    { value: 'adjustment', label: 'Adjustment (Reconciliation)' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit Transaction (${initialData?.transactionId})` : 'Record Capital Transaction'}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 pt-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Transaction Type */}
          <Select
            label="Transaction Type"
            options={typeOptions}
            error={errors.transactionType?.message}
            {...register('transactionType')}
          />

          {/* Amount */}
          <Input
            label="Amount (₹)"
            type="number"
            step="0.01"
            placeholder="0.00"
            error={errors.amount?.message}
            {...register('amount')}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Transaction Date */}
          <Input
            label="Transaction Date"
            type="date"
            max={format(new Date(), 'yyyy-MM-dd')}
            error={errors.transactionDate?.message}
            {...register('transactionDate')}
          />

          {/* Reference / UTR Number */}
          <Input
            label="Reference / UTR Number"
            placeholder="e.g. UTR12345678"
            error={errors.referenceNumber?.message}
            {...register('referenceNumber')}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Source */}
          <Input
            label="Source Account / Bank"
            placeholder="e.g. HDFC Bank, Cash Drawer"
            error={errors.source?.message}
            {...register('source')}
          />

          {/* Destination */}
          <Input
            label="Destination Account"
            placeholder="e.g. Prince Wallet, Branch Account"
            error={errors.destination?.message}
            {...register('destination')}
          />
        </div>

        {/* Description */}
        <Input
          label="Short Description"
          placeholder="e.g. Initial capital deposit for micro-loans"
          error={errors.description?.message}
          {...register('description')}
        />

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Additional Notes</label>
          <textarea
            rows={3}
            placeholder="Any background notes or terms..."
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            {...register('notes')}
          />
          {errors.notes?.message && (
            <p className="text-xs text-danger-600 mt-1">{errors.notes.message}</p>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            {isEditing ? 'Save Changes' : 'Record Transaction'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CapitalTransactionForm;
