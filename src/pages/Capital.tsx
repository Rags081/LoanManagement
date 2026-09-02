import React, { useState } from 'react';
import {
  useCapitalBalance,
  useCapitalSummary,
  useCapitalList,
  useCreateCapital,
  useUpdateCapital,
  useDeleteCapital,
} from '@/hooks/useCapital';
import {
  CapitalBalanceCards,
  CapitalSummaryChart,
  CapitalFilters,
  CapitalTransactionForm,
  CapitalTransactionList,
} from '@/components/capital';
import Button from '@/components/common/Button';
import { CapitalTransaction, CapitalCreate, CapitalFilterParams } from '@/types/capital';
import { useAuth } from '@/hooks/useAuth';
import { Plus, RefreshCw, Landmark } from 'lucide-react';

export const Capital: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  // Filters State
  const [filters, setFilters] = useState<CapitalFilterParams>({
    page: 1,
    limit: 10,
    transactionType: 'all',
    search: '',
    startDate: '',
    endDate: '',
  });

  // Modal State
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingTransaction, setEditingTransaction] = useState<CapitalTransaction | null>(null);

  // Queries
  const {
    data: balance,
    isLoading: isBalanceLoading,
    refetch: refetchBalance,
  } = useCapitalBalance();

  const {
    data: summary,
    isLoading: isSummaryLoading,
    refetch: refetchSummary,
  } = useCapitalSummary();

  const {
    data: listResponse,
    isLoading: isListLoading,
    refetch: refetchList,
  } = useCapitalList(filters);

  // Mutations
  const createMutation = useCreateCapital();
  const updateMutation = useUpdateCapital();
  const deleteMutation = useDeleteCapital();

  const handleRefreshAll = () => {
    refetchBalance();
    refetchSummary();
    refetchList();
  };

  const handleOpenCreate = () => {
    setEditingTransaction(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (tx: CapitalTransaction) => {
    setEditingTransaction(tx);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this capital transaction? Running balances will be recalculated.')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const handleFormSubmit = async (data: CapitalCreate) => {
    if (editingTransaction) {
      await updateMutation.mutateAsync({
        id: editingTransaction.id,
        data,
      });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  const handleResetFilters = () => {
    setFilters({
      page: 1,
      limit: 10,
      transactionType: 'all',
      search: '',
      startDate: '',
      endDate: '',
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-primary-50 text-primary-600 shadow-xs">
            <Landmark className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Capital Management</h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Track capital allocation, injections, and withdrawals between Provider and Operator
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={handleRefreshAll}
            leftIcon={<RefreshCw className="w-4 h-4" />}
            title="Refresh Ledger"
          >
            Refresh
          </Button>

          {isAdmin && (
            <Button onClick={handleOpenCreate} leftIcon={<Plus className="w-4 h-4" />}>
              Add Transaction
            </Button>
          )}
        </div>
      </div>

      {/* 1. Metric Balance Cards */}
      <CapitalBalanceCards balance={balance} isLoading={isBalanceLoading} />

      {/* 2. Monthly Summary Analytics Chart */}
      <CapitalSummaryChart data={summary} isLoading={isSummaryLoading} />

      {/* 3. Filter Toolbar */}
      <CapitalFilters
        filters={filters}
        onChange={setFilters}
        onReset={handleResetFilters}
      />

      {/* 4. Transactions Ledger Table */}
      <CapitalTransactionList
        transactions={listResponse?.data || []}
        total={listResponse?.total || 0}
        page={listResponse?.page || 1}
        limit={listResponse?.limit || 10}
        totalPages={listResponse?.totalPages || 1}
        onPageChange={(p) => setFilters((prev) => ({ ...prev, page: p }))}
        onEdit={handleOpenEdit}
        onDelete={handleDelete}
        isLoading={isListLoading}
      />

      {/* 5. Create / Edit Transaction Modal */}
      <CapitalTransactionForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingTransaction(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={editingTransaction}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
};

export default Capital;
