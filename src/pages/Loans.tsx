import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import loansApi from '@/api/loans';
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
import { getLoanDayOfMonth } from '@/utils/date';
import { Plus, HandCoins } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export const Loans: React.FC = () => {
  const { user } = useAuth();
  const canCreate = user?.role === 'admin' || user?.role === 'operator';

  const [filters, setFilters] = useState<LoanFilterParams>({
    page: 1,
    limit: 10,
    status: 'all',
    dayOfMonth: 'all',
  });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLoan, setEditingLoan] = useState<LoanWithBorrower | null>(null);

  // Queries & Mutations
  const { data: loanListData, isLoading: isListLoading } = useLoanList(filters);
  const { data: summaryData, isLoading: isSummaryLoading } = useLoanSummary(filters);

  // Filter criteria for complete dataset totals (independent of page and rows-per-page)
  const filterCriteriaWithoutPagination = useMemo(
    () => ({
      status: filters.status,
      search: filters.search,
      startDate: filters.startDate,
      endDate: filters.endDate,
      dayOfMonth: filters.dayOfMonth,
      limit: 10000,
      page: 1,
    }),
    [filters.status, filters.search, filters.startDate, filters.endDate, filters.dayOfMonth]
  );

  const totalCount = loanListData?.total || 0;
  const currentCount = loanListData?.data?.length || 0;
  const needsAllFetch = totalCount > currentCount || (filters.dayOfMonth && filters.dayOfMonth !== 'all');

  const { data: allFilteredData } = useQuery({
    queryKey: ['loans', 'all-filtered', filterCriteriaWithoutPagination],
    queryFn: async () => {
      const res = await loansApi.list(filterCriteriaWithoutPagination);
      return res.data;
    },
    enabled: Boolean(needsAllFetch),
  });

  const allFilteredLoans = needsAllFetch
    ? allFilteredData?.data || loanListData?.data || []
    : loanListData?.data || [];

  const selectedDay = filters.dayOfMonth && filters.dayOfMonth !== 'all' ? filters.dayOfMonth : null;

  // Complete dataset matching all active filters (including day filter)
  const dayFilteredAllLoans = useMemo(() => {
    if (!selectedDay) return allFilteredLoans;
    return allFilteredLoans.filter((l) => getLoanDayOfMonth(l.loanGivenDate) === selectedDay);
  }, [allFilteredLoans, selectedDay]);

  // Total count of matching loans across all pages
  const totalFilteredCount = selectedDay ? dayFilteredAllLoans.length : (loanListData?.total || 0);
  const pageSize = filters.limit || 10;
  const currentPage = filters.page || 1;
  const totalFilteredPages = Math.max(1, Math.ceil(totalFilteredCount / pageSize));

  // Current page loans
  const displayedLoans = useMemo(() => {
    if (selectedDay) {
      const startIndex = (currentPage - 1) * pageSize;
      return dayFilteredAllLoans.slice(startIndex, startIndex + pageSize);
    }
    return loanListData?.data || [];
  }, [selectedDay, dayFilteredAllLoans, currentPage, pageSize, loanListData?.data]);

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
      dayOfMonth: 'all',
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
        loans={displayedLoans}
        allLoans={dayFilteredAllLoans}
        total={totalFilteredCount}
        page={currentPage}
        limit={pageSize}
        totalPages={totalFilteredPages}
        isLoading={isListLoading}
        dayOfMonth={filters.dayOfMonth || 'all'}
        onDayOfMonthChange={(day) => setFilters((prev) => ({ ...prev, dayOfMonth: day, page: 1 }))}
        onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
        onLimitChange={(limit) => setFilters((prev) => ({ ...prev, limit, page: 1 }))}
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
