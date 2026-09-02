import React, { useState } from 'react';
import Button from '@/components/common/Button';
import {
  PaymentSummaryCards,
  PaymentFilters,
  PaymentList,
  PaymentForm,
  PaymentReceipt,
  PaymentVoidConfirm,
} from '@/components/payments';
import {
  usePaymentList,
  usePaymentSummary,
  useCreatePayment,
  useVoidPayment,
} from '@/hooks/usePayments';
import { PaymentWithLoan, PaymentFilterParams } from '@/types/payment';
import { PaymentSchemaType } from '@/utils/validation';
import { Plus, CreditCard } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export const Payments: React.FC = () => {
  const { user } = useAuth();
  const canRecord = user?.role === 'admin' || user?.role === 'operator';

  const [filters, setFilters] = useState<PaymentFilterParams>({
    page: 1,
    limit: 10,
    paymentMode: 'all',
  });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedReceiptPayment, setSelectedReceiptPayment] = useState<PaymentWithLoan | null>(null);
  const [selectedVoidPayment, setSelectedVoidPayment] = useState<PaymentWithLoan | null>(null);

  // Queries & Mutations
  const { data: paymentListData, isLoading: isListLoading } = usePaymentList(filters);
  const { data: summaryData, isLoading: isSummaryLoading } = usePaymentSummary(filters);

  const createMutation = useCreatePayment();
  const voidMutation = useVoidPayment();

  const handleResetFilters = () => {
    setFilters({
      page: 1,
      limit: 10,
      paymentMode: 'all',
      search: '',
      startDate: '',
      endDate: '',
    });
  };

  const handleRecordSubmit = async (data: PaymentSchemaType) => {
    await createMutation.mutateAsync({
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
    setIsFormOpen(false);
  };

  const handleVoidConfirm = async (voidReason: string) => {
    if (selectedVoidPayment) {
      await voidMutation.mutateAsync({
        id: selectedVoidPayment.id,
        data: { voidReason },
      });
      setSelectedVoidPayment(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-indigo-600" /> Payment Management
          </h1>
          <p className="text-sm text-slate-500">
            Record loan repayments, manage interest/principal allocations, and issue receipts
          </p>
        </div>

        {canRecord && (
          <Button
            onClick={() => setIsFormOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Record Repayment
          </Button>
        )}
      </div>

      {/* Summary Metrics */}
      <PaymentSummaryCards summary={summaryData} isLoading={isSummaryLoading} />

      {/* Filter Bar */}
      <PaymentFilters
        filters={filters}
        onFilterChange={setFilters}
        onReset={handleResetFilters}
      />

      {/* Payments List Table */}
      <PaymentList
        payments={paymentListData?.data || []}
        total={paymentListData?.total || 0}
        page={paymentListData?.page || 1}
        limit={paymentListData?.limit || 10}
        totalPages={paymentListData?.totalPages || 1}
        isLoading={isListLoading}
        onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
        onViewReceipt={(payment) => setSelectedReceiptPayment(payment)}
        onVoid={(payment) => setSelectedVoidPayment(payment)}
      />

      {/* Record Payment Form Modal */}
      <PaymentForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleRecordSubmit}
        isLoading={createMutation.isPending}
      />

      {/* Payment Receipt View / Print Modal */}
      <PaymentReceipt
        isOpen={!!selectedReceiptPayment}
        onClose={() => setSelectedReceiptPayment(null)}
        payment={selectedReceiptPayment}
      />

      {/* Void Payment Confirmation Modal */}
      <PaymentVoidConfirm
        isOpen={!!selectedVoidPayment}
        onClose={() => setSelectedVoidPayment(null)}
        onConfirm={handleVoidConfirm}
        payment={selectedVoidPayment}
        isLoading={voidMutation.isPending}
      />
    </div>
  );
};

export default Payments;
