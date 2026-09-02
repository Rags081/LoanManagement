import React from 'react';
import Card from '@/components/common/Card';
import Table, { Column } from '@/components/common/Table';
import { LoanPaymentRecord } from '@/types/loan';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { Receipt, AlertCircle } from 'lucide-react';

interface LoanPaymentHistoryProps {
  payments?: LoanPaymentRecord[];
  isLoading?: boolean;
}

export const LoanPaymentHistory: React.FC<LoanPaymentHistoryProps> = ({
  payments = [],
  isLoading = false,
}) => {
  const columns: Column<LoanPaymentRecord>[] = [
    {
      key: 'receiptNumber',
      header: 'Receipt #',
      render: (p: LoanPaymentRecord) => (
        <span className="font-mono font-semibold text-indigo-600">
          {p.receiptNumber}
        </span>
      ),
    },
    {
      key: 'paymentDate',
      header: 'Date',
      render: (p: LoanPaymentRecord) => (
        <span className="text-slate-600 text-xs font-medium">
          {formatDate(p.paymentDate)}
        </span>
      ),
    },
    {
      key: 'paymentAmount',
      header: 'Total Paid',
      render: (p: LoanPaymentRecord) => (
        <span className="font-bold text-slate-900">
          {formatCurrency(p.paymentAmount)}
        </span>
      ),
    },
    {
      key: 'principalPortion',
      header: 'Principal',
      render: (p: LoanPaymentRecord) => (
        <span className="text-xs font-semibold text-emerald-600">
          {formatCurrency(p.principalPortion)}
        </span>
      ),
    },
    {
      key: 'interestPortion',
      header: 'Interest',
      render: (p: LoanPaymentRecord) => (
        <span className="text-xs font-semibold text-blue-600">
          {formatCurrency(p.interestPortion)}
        </span>
      ),
    },
    {
      key: 'paymentMode',
      header: 'Mode',
      render: (p: LoanPaymentRecord) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-slate-100 text-slate-700">
          {p.paymentMode.replace('_', ' ')}
        </span>
      ),
    },
    {
      key: 'isVoid',
      header: 'Status',
      render: (p: LoanPaymentRecord) =>
        p.isVoid ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            Voided
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Success
          </span>
        ),
    },
    {
      key: 'notes',
      header: 'Notes',
      render: (p: LoanPaymentRecord) => (
        <span className="text-xs text-slate-500 truncate max-w-xs block">
          {p.notes || '—'}
        </span>
      ),
    },
  ];

  return (
    <Card className="p-6 border border-slate-200 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-indigo-600" /> Recorded Payment Transactions
          </h3>
          <p className="text-xs text-slate-500">History of all repayments attributed to this loan</p>
        </div>
        <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
          {payments.length} Transaction{payments.length === 1 ? '' : 's'}
        </span>
      </div>

      {payments.length === 0 && !isLoading ? (
        <div className="text-center py-8 rounded-xl bg-slate-50 border border-dashed border-slate-200">
          <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700">No repayments recorded yet</p>
          <p className="text-xs text-slate-400 mt-1">Payments recorded in the Payment Management module will appear here.</p>
        </div>
      ) : (
        <Table<LoanPaymentRecord>
          columns={columns}
          data={payments}
          isLoading={isLoading}
          keyExtractor={(p) => p.id}
        />
      )}
    </Card>
  );
};

export default LoanPaymentHistory;
