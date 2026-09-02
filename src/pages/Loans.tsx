import React, { useState } from 'react';
import Button from '@/components/common/Button';
import {
  LoanSummaryCards,
  LoanFilters,
  LoanList,
  LoanForm,
} from '@/components/loans';
import {
  useLoanList,
  useLoanSummary,
  useCreateLoan,
  useUpdateLoan,
  useDeleteLoan,
  useUpdateLoanStatus,
} from '@/hooks/useLoans';
import { LoanWithBorrower, LoanFilterParams, LoanStatus } from '@/types/loan';
import { LoanSchemaType } from '@/utils/validation';
import { Plus, HandCoins } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export const Loans: React.FC = () => {
  const { user } = useAuth();
  const canCreate = user?.role === 'admin' || user?.role === 'operator';

  const [filters, setFilters] = useState<LoanFilterParams>({
    page: 1,
    limit: 10,
    status: 'all',
  });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLoan, setEditingLoan] = useState<LoanWithBorrower | null>(null);

  // Queries & Mutations
  const { data: loanListData, isLoading: isListLoading } = useLoanList(filters);
  const { data: summaryData, isLoading: isSummaryLoading } = useLoanSummary(filters);

  const createMutation = useCreateLoan();
  const updateMutation = useUpdateLoan();
  const deleteMutation = useDeleteLoan();
  const updateStatusMutation = useUpdateLoanStatus();

  const handleResetFilters = () => {
    setFilters({
      page: 1,
      limit: 10,
      status: 'all',
      search: '',
      startDate: '',
      endDate: '',
    });
  };

  const handleFormSubmit = async (data: LoanSchemaType) => {
    if (editingLoan) {
      await updateMutation.mutateAsync({
        id: editingLoan.id,
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
    } else {
      await createMutation.mutateAsync({
        borrowerId: Number(data.borrowerId),
        principalAmount: Number(data.principalAmount),
        interestRate: Number(data.interestRate),
        interestRateType: data.interestRateType,
        tenure: data.tenure,
        tenureUnit: data.tenureUnit,
        loanGivenDate: data.loanGivenDate,
        notes: data.notes,
      });
    }
    setIsFormOpen(false);
    setEditingLoan(null);
  };

  const handleEdit = (loan: LoanWithBorrower) => {
    setEditingLoan(loan);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    await deleteMutation.mutateAsync(id);
  };

  const handleStatusChange = async (id: number, status: LoanStatus) => {
    await updateStatusMutation.mutateAsync({ id, status });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <HandCoins className="w-6 h-6 text-indigo-600" /> Loan Management
          </h1>
          <p className="text-sm text-slate-500">
            Disburse loans, calculate interest schedules, and monitor outstanding repayments
          </p>
        </div>

        {canCreate && (
          <Button
            onClick={() => {
              setEditingLoan(null);
              setIsFormOpen(true);
            }}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Disburse New Loan
          </Button>
        )}
      </div>

      {/* Summary Portfolio Metrics */}
      <LoanSummaryCards summary={summaryData} isLoading={isSummaryLoading} />

      {/* Filters */}
      <LoanFilters
        filters={filters}
        onFilterChange={setFilters}
        onReset={handleResetFilters}
      />

      {/* Loan List Table */}
      <LoanList
        loans={loanListData?.data || []}
        total={loanListData?.total || 0}
        page={loanListData?.page || 1}
        limit={loanListData?.limit || 10}
        totalPages={loanListData?.totalPages || 1}
        isLoading={isListLoading}
        onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onStatusChange={handleStatusChange}
      />

      {/* Loan Form Modal */}
      <LoanForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingLoan(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={editingLoan}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
};

export default Loans;
