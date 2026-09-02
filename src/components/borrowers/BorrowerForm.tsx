import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import Input from '@/components/common/Form/Input';
import Select from '@/components/common/Form/Select';
import { borrowerSchema, BorrowerSchemaType } from '@/utils/validation';
import { Borrower } from '@/types/borrower';
import { User, Phone, Mail, MapPin, FileText, CheckCircle2 } from 'lucide-react';

interface BorrowerFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: BorrowerSchemaType) => Promise<void> | void;
  initialData?: Borrower | null;
  isLoading?: boolean;
}

export const BorrowerForm: React.FC<BorrowerFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading = false,
}) => {
  const isEdit = !!initialData;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BorrowerSchemaType>({
    resolver: zodResolver(borrowerSchema),
    defaultValues: {
      fullName: '',
      phone: '',
      email: '',
      address: '',
      notes: '',
      status: 'active',
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        reset({
          fullName: initialData.fullName,
          phone: initialData.phone,
          email: initialData.email || '',
          address: initialData.address || '',
          notes: initialData.notes || '',
          status: initialData.status,
        });
      } else {
        reset({
          fullName: '',
          phone: '',
          email: '',
          address: '',
          notes: '',
          status: 'active',
        });
      }
    }
  }, [isOpen, initialData, reset]);

  const statusOptions = [
    { value: 'active', label: 'Active (Eligible for Loans)' },
    { value: 'inactive', label: 'Inactive (No New Loans)' },
    { value: 'blacklisted', label: 'Blacklisted (High Risk / Defaulted)' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? `Edit Borrower (${initialData.borrowerId})` : 'Register New Borrower'}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Full Name */}
          <Input
            label="Full Name"
            placeholder="e.g. Ramesh Kumar"
            required
            leftIcon={<User className="w-4 h-4 text-slate-400" />}
            error={errors.fullName?.message}
            {...register('fullName')}
          />

          {/* Phone Number */}
          <Input
            label="Phone Number (10 Digits)"
            placeholder="e.g. 9876543210"
            required
            maxLength={10}
            leftIcon={<Phone className="w-4 h-4 text-slate-400" />}
            error={errors.phone?.message}
            helperText="10-digit mobile number for SMS/reminders"
            {...register('phone')}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Email */}
          <Input
            label="Email Address"
            type="email"
            placeholder="e.g. ramesh@example.com (optional)"
            leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
            error={errors.email?.message}
            {...register('email')}
          />

          {/* Status */}
          <Select
            label="Borrower Status"
            options={statusOptions}
            error={errors.status?.message}
            {...register('status')}
          />
        </div>

        {/* Address */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1.5">
            Residential / Business Address
          </label>
          <div className="relative rounded-lg">
            <div className="absolute top-2.5 left-3 flex items-center pointer-events-none text-slate-400">
              <MapPin className="w-4 h-4" />
            </div>
            <textarea
              rows={2}
              placeholder="e.g. House No. 42, Sector 15, Near City Market..."
              className={`block w-full rounded-lg border bg-white pl-10 pr-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 ${
                errors.address
                  ? 'border-danger-400 focus:border-danger-500 focus:ring-danger-500/20'
                  : 'border-slate-300 focus:border-primary-500 focus:ring-primary-500/20'
              }`}
              {...register('address')}
            />
          </div>
          {errors.address && (
            <p className="text-xs text-danger-600 font-medium mt-1">{errors.address.message}</p>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1.5">
            Internal Notes / References
          </label>
          <div className="relative rounded-lg">
            <div className="absolute top-2.5 left-3 flex items-center pointer-events-none text-slate-400">
              <FileText className="w-4 h-4" />
            </div>
            <textarea
              rows={2}
              placeholder="e.g. Referred by Suresh; verified Aadhaar & PAN card copy on file..."
              className={`block w-full rounded-lg border bg-white pl-10 pr-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 ${
                errors.notes
                  ? 'border-danger-400 focus:border-danger-500 focus:ring-danger-500/20'
                  : 'border-slate-300 focus:border-primary-500 focus:ring-primary-500/20'
              }`}
              {...register('notes')}
            />
          </div>
          {errors.notes && (
            <p className="text-xs text-danger-600 font-medium mt-1">{errors.notes.message}</p>
          )}
        </div>

        {/* Modal Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={isLoading}
            leftIcon={<CheckCircle2 className="w-4 h-4" />}
          >
            {isEdit ? 'Save Changes' : 'Register Borrower'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default BorrowerForm;
