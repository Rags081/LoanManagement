import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import {
  LoanStatusBadge,
  LoanOutstandingCard,
  LoanPaymentHistory,
  LoanForm,
} from '@/components/loans';
import { PaymentForm } from '@/components/payments';
import {
  useLoan,
  useUpdateLoan,
  useDeleteLoan,
  useUpdateLoanStatus,
} from '@/hooks/useLoans';
import { useCreatePayment } from '@/hooks/usePayments';
import { LoanStatus } from '@/types/loan';
import { LoanSchemaType, PaymentSchemaType } from '@/utils/validation';
import { formatCurrency, formatDate, calculateCalendarTenure } from '@/utils/formatters';
import { useAuth } from '@/hooks/useAuth';
import {
  ArrowLeft,
  Calendar,
  User,
  Phone,
  Mail,
  MapPin,
  Clock,
  Percent,
  FileText,
  Edit,
  Trash2,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';

export const LoanDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const canEdit = user?.role === 'admin' || user?.role === 'operator';

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<LoanStatus>('active');

  const { data: loan, isLoading, isError, error, refetch } = useLoan(id);
  const updateMutation = useUpdateLoan();
  const deleteMutation = useDeleteLoan();
  const updateStatusMutation = useUpdateLoanStatus();
  const createPaymentMutation = useCreatePayment();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-slate-200 rounded w-1/4 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-48 bg-slate-200 rounded-xl animate-pulse" />
          <div className="h-48 bg-slate-200 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (isError) {
    const errorMsg =
      (error as unknown as { response?: { data?: { message?: string } } })?.response?.data?.message ||
      (error as Error)?.message ||
      'An unexpected error occurred while loading loan details.';
    return (
      <div className="text-center py-16 bg-white rounded-xl border border-rose-200 p-8 space-y-4">
        <p className="text-lg font-bold text-rose-800">Error Loading Loan</p>
        <p className="text-sm text-slate-500 max-w-md mx-auto">{errorMsg}</p>
        <div className="flex justify-center gap-3 pt-2">
          <Button variant="outline" onClick={() => refetch()}>
            Retry
          </Button>
          <Link to="/loans">
            <Button variant="primary" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back to Loans
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!loan) {
    return (
      <div className="text-center py-16 bg-white rounded-xl border border-slate-200 p-8 space-y-4">
        <p className="text-lg font-bold text-slate-800">Loan not found</p>
        <p className="text-sm text-slate-500">The requested loan does not exist or has been deleted.</p>
        <Link to="/loans">
          <Button variant="outline" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Loans
          </Button>
        </Link>
      </div>
    );
  }

  const handleEditSubmit = async (data: LoanSchemaType) => {
    if (!id) return;
    await updateMutation.mutateAsync({
      id: Number(id),
      data: {
        principalAmount: Number(data.principalAmount),
        interestRate: Number(data.interestRate),
        interestRateType: data.interestRateType,
        tenure: data.tenure,
        tenureUnit: data.tenureUnit,
        loanGivenDate: data.loanGivenDate,
        notes: data.notes,
      },
    });
    setIsEditOpen(false);
  };

  const handleDelete = async () => {
    if (!id) return;
    await deleteMutation.mutateAsync(Number(id));
    navigate('/loans');
  };

  const handleStatusSubmit = async () => {
    if (!id) return;
    await updateStatusMutation.mutateAsync({
      id: Number(id),
      status: selectedStatus,
    });
    setIsStatusOpen(false);
  };

  const handlePaymentSubmit = async (data: PaymentSchemaType) => {
    await createPaymentMutation.mutateAsync({
      loanId: Number(data.loanId),
      paymentDate: data.paymentDate,
      paymentAmount: Number(data.paymentAmount),
      paymentMode: data.paymentMode,
      referenceNumber: data.referenceNumber,
      notes: data.notes,
      allocationMethod: data.allocationMethod,
      principalPortion: data.principalPortion ? Number(data.principalPortion) : undefined,
      interestPortion: data.interestPortion ? Number(data.interestPortion) : undefined,
    });
    setIsPaymentOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/loans"
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">{loan.loanId}</h1>
              <LoanStatusBadge status={loan.status} size="md" />
            </div>
            <p className="text-xs text-slate-500">
              Created on {formatDate(loan.createdAt)} {loan.creatorName ? `by ${loan.creatorName}` : ''}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {canEdit && (loan.status === 'active' || loan.status === 'overdue') && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsPaymentOpen(true)}
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              Record Repayment
            </Button>
          )}

          {canEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditOpen(true)}
              leftIcon={<Edit className="w-4 h-4" />}
            >
              Edit Loan
            </Button>
          )}

          {isAdmin && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedStatus(loan.status);
                  setIsStatusOpen(true);
                }}
                leftIcon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}
              >
                Change Status
              </Button>

              <Button
                variant="danger"
                size="sm"
                onClick={() => setIsDeleteOpen(true)}
                leftIcon={<Trash2 className="w-4 h-4" />}
              >
                Delete
              </Button>
            </>
          )}
        </div>
      </div>

      {/* 2-Column Overview Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Loan Financial Terms */}
        <Card className="p-6 border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Percent className="w-4 h-4 text-indigo-600" /> Loan Terms & Interest Rates
          </h3>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-slate-500 block">Principal Disbursed</span>
              <span className="text-base font-bold text-slate-900 mt-1 block">
                {formatCurrency(loan.principalAmount)}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-slate-500 block">Interest Rate</span>
              <span className="text-base font-bold text-indigo-700 mt-1 block">
                {loan.interestRate}% <span className="text-xs font-normal text-slate-500">/ {loan.interestRateType}</span>
              </span>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-slate-500 block">Monthly Interest Amount</span>
              <span className="text-sm font-bold text-indigo-900 mt-1 block">
                {formatCurrency(loan.monthlyInterestAmount || 0)} <span className="text-[11px] font-normal text-slate-500">/ mo</span>
              </span>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-slate-500 block">Daily Pro-Rated Interest</span>
              <span className="text-sm font-bold text-indigo-900 mt-1 block">
                {formatCurrency(loan.dailyInterestAmount || 0)} <span className="text-[11px] font-normal text-slate-500">/ day</span>
              </span>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-slate-500 block">Loan Date</span>
              <span className="text-sm font-semibold text-slate-800 mt-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {formatDate(loan.loanGivenDate)}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-slate-500 block">Loan Nature</span>
              <span className="text-sm font-semibold text-emerald-700 mt-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-500" />
                Open-ended (No Fixed Tenure)
              </span>
            </div>

            {/* Live Accrued Tenure Duration Tile */}
            <div className="p-3 rounded-lg bg-indigo-50/70 border border-indigo-200 col-span-2">
              <span className="text-xs font-bold text-indigo-950 block">
                {loan.status === 'completed' ? 'Final Settled Calendar Tenure' : 'Actual Elapsed Calendar Tenure'}
              </span>
              <span className="text-sm font-bold text-indigo-900 mt-1 flex flex-wrap items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                {calculateCalendarTenure(
                  loan.loanGivenDate,
                  loan.status === 'completed'
                    ? (loan.settlementDate || loan.outstanding?.settlementDate)
                    : undefined
                ).formatted}
                <span className="text-xs font-normal text-indigo-700">
                  (From {formatDate(loan.loanGivenDate)} {loan.status === 'completed' && (loan.settlementDate || loan.outstanding?.settlementDate) ? `to ${formatDate(loan.settlementDate || loan.outstanding?.settlementDate)} — Permanently Settled` : 'to Today — Ongoing until fully paid'})
                </span>
              </span>
            </div>
          </div>

          {loan.notes && (
            <div className="p-3 rounded-lg bg-indigo-50/50 border border-indigo-100 text-xs">
              <span className="font-bold text-indigo-900 block mb-1 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" /> Notes & Conditions
              </span>
              <p className="text-indigo-800 leading-relaxed">{loan.notes}</p>
            </div>
          )}
        </Card>

        {/* Borrower Profile Overview */}
        <Card className="p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-600" /> Borrower Profile
            </h3>
            <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
              {loan.borrower?.borrowerId || loan.borrowerIdCode || `BOR-${loan.borrowerId}`}
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50">
              <span className="text-slate-500">Full Name</span>
              <span className="font-bold text-slate-900 text-sm">
                {loan.borrower?.fullName || loan.borrowerName || '—'}
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" /> Phone Number
              </span>
              <span className="font-semibold text-slate-800">
                {loan.borrower?.phone || loan.borrowerPhone || '—'}
              </span>
            </div>

            {loan.borrower?.email && (
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" /> Email
                </span>
                <span className="font-medium text-slate-800">{loan.borrower.email}</span>
              </div>
            )}

            {loan.borrower?.address && (
              <div className="p-2.5 rounded-lg bg-slate-50 space-y-1">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" /> Address
                </span>
                <p className="text-slate-700">{loan.borrower.address}</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Dynamic Outstanding Card */}
      <LoanOutstandingCard outstanding={loan.outstanding} />

      {/* Payment History Table */}
      <LoanPaymentHistory payments={loan.payments} />

      {/* Edit Modal */}
      <LoanForm
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSubmit={handleEditSubmit}
        initialData={loan}
        isLoading={updateMutation.isPending}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title={`Delete Loan ${loan.loanId}`}
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs">
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Are you sure you want to delete this loan?</p>
              <p className="mt-1">
                Loans with payment records cannot be deleted. Ensure no payments exist before proceeding.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} isLoading={deleteMutation.isPending}>
              Delete Loan
            </Button>
          </div>
        </div>
      </Modal>

      {/* Change Status Modal */}
      <Modal
        isOpen={isStatusOpen}
        onClose={() => setIsStatusOpen(false)}
        title={`Change Status: ${loan.loanId}`}
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            Select the new lifecycle status for this loan:
          </p>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as LoanStatus)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            <option value="active">Active (Repayments Ongoing)</option>
            <option value="overdue">Overdue (Past Due Date)</option>
            <option value="completed">Completed (Fully Repaid)</option>
            <option value="cancelled">Cancelled (Voided/Aborted)</option>
          </select>

          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <Button variant="outline" onClick={() => setIsStatusOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleStatusSubmit}
              isLoading={updateStatusMutation.isPending}
            >
              Save Status
            </Button>
          </div>
        </div>
      </Modal>

      {/* Record Repayment Modal */}
      <PaymentForm
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        onSubmit={handlePaymentSubmit}
        defaultLoan={loan}
        isLoading={createPaymentMutation.isPending}
      />
    </div>
  );
};

export default LoanDetails;
