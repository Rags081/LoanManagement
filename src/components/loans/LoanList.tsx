import React, { useState } from 'react';
import Table, { Column } from '@/components/common/Table';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import Select from '@/components/common/Form/Select';
import { LoanWithBorrower, LoanStatus } from '@/types/loan';
import { LoanStatusBadge } from './LoanStatusBadge';
import { formatCurrency, formatDate, calculateCalendarTenure } from '@/utils/formatters';
import { useNavigate } from 'react-router-dom';
import {
  Eye,
  Edit,
  Trash2,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  Calendar,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface LoanListProps {
  loans: LoanWithBorrower[];
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
  isLoading?: boolean;
  onPageChange?: (page: number) => void;
  onEdit: (loan: LoanWithBorrower) => void;
  onDelete: (id: number) => void;
  onStatusChange?: (id: number, status: LoanStatus) => void;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
  };
}

export const LoanList: React.FC<LoanListProps> = ({
  loans,
  total,
  page,
  limit,
  totalPages,
  isLoading = false,
  onPageChange,
  onEdit,
  onDelete,
  onStatusChange,
  pagination,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const canEdit = user?.role === 'admin' || user?.role === 'operator';

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [statusModalLoan, setStatusModalLoan] = useState<LoanWithBorrower | null>(null);
  const [newStatus, setNewStatus] = useState<LoanStatus>('active');

  const curPage = pagination?.currentPage || page || 1;
  const numPages = pagination?.totalPages || totalPages || 1;
  const totalCount = pagination?.totalItems || total || loans.length;
  const pageSize = pagination?.itemsPerPage || limit || 10;
  const handlePageChange = pagination?.onPageChange || onPageChange;

  const columns: Column<LoanWithBorrower>[] = [
    {
      key: 'loanDate',
      header: 'Loan Date',
      render: (loan: LoanWithBorrower) => (
        <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 whitespace-nowrap">
          <Calendar className="w-3.5 h-3.5 text-indigo-600" />
          {formatDate(loan.loanGivenDate)}
        </span>
      ),
    },
    {
      key: 'loanId',
      header: 'Loan ID',
      render: (loan: LoanWithBorrower) => (
        <button
          onClick={() => navigate(`/loans/${loan.id}`)}
          className="text-left font-mono font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          {loan.loanId}
        </button>
      ),
    },
    {
      key: 'borrower',
      header: 'Borrower',
      render: (loan: LoanWithBorrower) => (
        <div>
          <p className="font-semibold text-slate-900">{loan.borrowerName || '—'}</p>
          <p className="text-xs text-slate-500">{loan.borrowerPhone || loan.borrowerIdCode || ''}</p>
        </div>
      ),
    },
    {
      key: 'principal',
      header: 'Principal (₹)',
      render: (loan: LoanWithBorrower) => (
        <span className="font-bold text-slate-900">
          {formatCurrency(loan.principalAmount)}
        </span>
      ),
    },
    {
      key: 'interestTerms',
      header: 'Interest Terms',
      render: (loan: LoanWithBorrower) => (
        <div>
          {loan.interestRateType === 'daily' ? (
            <>
              <p className="text-xs font-bold text-indigo-700">
                {formatCurrency(loan.dailyInterestAmount || 0)}
                <span className="text-[10px] font-normal text-slate-500"> / day</span>
              </p>
              <p className="text-[11px] text-slate-500">
                Rate: {loan.interestRate}% (daily)
              </p>
            </>
          ) : (
            <>
              <p className="text-xs font-bold text-indigo-700">
                {formatCurrency(loan.monthlyInterestAmount || 0)}
                <span className="text-[10px] font-normal text-slate-500"> / mo</span>
              </p>
              <p className="text-[11px] text-slate-500">
                Rate: {loan.interestRate}% ({loan.interestRateType})
              </p>
            </>
          )}
        </div>
      ),
    },
    {
      key: 'principalReceived',
      header: 'Principal Received',
      render: (loan: LoanWithBorrower) => {
        const princ = Number(loan.principalReceived || 0);
        return (
          <div>
            {princ > 0 ? (
              <span className="font-bold text-slate-900">
                {formatCurrency(princ)}
              </span>
            ) : (
              <span className="text-xs font-medium text-slate-400">
                {formatCurrency(0)}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'interestReceived',
      header: 'Interest Received',
      render: (loan: LoanWithBorrower) => {
        const totalInt = Number(loan.interestReceived || 0);
        const details = loan.interestPaymentDetails || [];
        const hasDetails = details.length > 0 && totalInt > 0;
        const firstThree = details.slice(0, 3);
        const extraCount = details.length - 3;

        if (!hasDetails) {
          return (
            <span className="text-xs font-medium text-slate-400">
              {formatCurrency(0)}
            </span>
          );
        }

        return (
          <div className="relative group inline-block py-0.5">
            <div>
              <span className="font-bold text-slate-900 block text-xs">
                {formatCurrency(totalInt)}
              </span>
              <div className="mt-1 space-y-0.5">
                {firstThree.map((p, idx) => (
                  <span key={idx} className="block text-[11px] text-slate-600 font-medium leading-tight">
                    {formatCurrency(p.interestPortion)}
                  </span>
                ))}
                {extraCount > 0 && (
                  <span className="text-[10px] font-semibold text-indigo-600 block leading-tight">
                    +{extraCount} more
                  </span>
                )}
              </div>
            </div>

            {/* Hover Popover / Tooltip showing ALL interest payments */}
            <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-50 min-w-[210px] p-3 bg-slate-900 text-white rounded-xl shadow-2xl border border-slate-700 pointer-events-none transition-all">
              <div className="border-b border-slate-700 pb-2 mb-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Interest Received
                </p>
                <p className="text-sm font-bold text-emerald-400 mt-0.5">
                  Total Interest: {formatCurrency(totalInt)}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {details.length} payment{details.length > 1 ? 's' : ''} recorded
                </p>
              </div>

              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {details.map((p, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs py-0.5 border-b border-slate-800/60 last:border-0">
                    <span className="font-semibold text-slate-200">
                      {formatCurrency(p.interestPortion)}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {formatDate(p.paymentDate)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'amountReceived',
      header: 'Amount Received (₹)',
      render: (loan: LoanWithBorrower) => (
        <div>
          {loan.totalReceived && loan.totalReceived > 0 ? (
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" />
              +{formatCurrency(loan.totalReceived)}
            </span>
          ) : (
            <span className="text-xs font-medium text-slate-400">₹0</span>
          )}
        </div>
      ),
    },
    {
      key: 'totalOutstanding',
      header: 'Total Outstanding (₹)',
      render: (loan: LoanWithBorrower) => {
        const isComp = loan.status === 'completed' || loan.isSettled || loan.totalOutstanding === 0;
        return (
          <div>
            {isComp ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
                <CheckCircle2 className="w-3 h-3" /> ₹0 (Settled)
              </span>
            ) : (
              <div>
                <span className="text-xs font-black text-indigo-950 block">
                  {formatCurrency(loan.totalOutstanding)}
                </span>
                {loan.principalOutstanding !== undefined && loan.principalOutstanding !== loan.principalAmount && (
                  <span className="text-[10px] text-slate-500 font-medium">
                    (Princ: {formatCurrency(loan.principalOutstanding)})
                  </span>
                )}
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: 'actualTenure',
      header: 'Actual Tenure',
      render: (loan: LoanWithBorrower) => {
        const isComp = loan.status === 'completed' || loan.isSettled;
        const endDate = isComp && (loan.settlementDate || loan.lastPaymentDate)
          ? (loan.settlementDate || loan.lastPaymentDate)
          : undefined;
        const tenureText = calculateCalendarTenure(loan.loanGivenDate, endDate).formatted;

        return (
          <div>
            {isComp ? (
              <div className="p-1 rounded bg-emerald-50 border border-emerald-200/80">
                <p className="text-[11px] font-bold text-emerald-800 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                  {tenureText} — Settled
                </p>
                <p className="text-[10px] text-emerald-700">
                  {loan.settlementDate ? formatDate(loan.settlementDate) : 'Locked'}
                </p>
              </div>
            ) : (
              <div className="p-1 rounded bg-indigo-50/70 border border-indigo-100">
                <p className="text-[11px] font-bold text-indigo-900 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-indigo-600 shrink-0" />
                  {tenureText} — Ongoing
                </p>
                <p className="text-[10px] text-indigo-700 font-medium flex items-center gap-0.5">
                  <Sparkles className="w-2.5 h-2.5 text-indigo-500" />
                  Active to Today
                </p>
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (loan: LoanWithBorrower) => <LoanStatusBadge status={loan.status} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (loan: LoanWithBorrower) => (
        <div className="flex items-center gap-1 justify-end">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => navigate(`/loans/${loan.id}`)}
            title="View Details & Ledger"
            className="p-1.5"
          >
            <Eye className="w-4 h-4 text-slate-600" />
          </Button>

          {canEdit && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onEdit(loan)}
              title="Edit Loan Terms"
              className="p-1.5"
            >
              <Edit className="w-4 h-4 text-indigo-600" />
            </Button>
          )}

          {isAdmin && onStatusChange && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setStatusModalLoan(loan);
                setNewStatus(loan.status);
              }}
              title="Override Status / Settle Loan"
              className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
            >
              <CheckCircle2 className="w-4 h-4" />
            </Button>
          )}

          {isAdmin && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setDeleteId(loan.id)}
              title="Delete Loan"
              className="p-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <Table
          columns={columns}
          data={loans}
          keyExtractor={(item) => item.id}
          isLoading={isLoading}
          emptyMessage="No loans found. Disburse a new loan to get started."
        />

        {/* Pagination Bar */}
        {numPages > 1 && handlePageChange && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
            <div className="text-xs text-slate-500">
              Showing {(curPage - 1) * pageSize + 1} to{' '}
              {Math.min(curPage * pageSize, totalCount)} of {totalCount} loans
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={curPage <= 1}
                onClick={() => handlePageChange(curPage - 1)}
                leftIcon={<ChevronLeft className="w-4 h-4" />}
              >
                Previous
              </Button>
              <span className="text-xs font-semibold text-slate-700 px-2">
                Page {curPage} of {numPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={curPage >= numPages}
                onClick={() => handlePageChange(curPage + 1)}
                rightIcon={<ChevronRight className="w-4 h-4" />}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        title="Confirm Loan Deletion"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-rose-50 text-rose-800">
            <ShieldAlert className="w-6 h-6 text-rose-600 flex-shrink-0" />
            <p className="text-xs">
              Are you sure you want to delete this loan? Loans with recorded payments cannot be deleted.
            </p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (deleteId) {
                  onDelete(deleteId);
                  setDeleteId(null);
                }
              }}
            >
              Delete Loan
            </Button>
          </div>
        </div>
      </Modal>

      {/* Status Override / Settlement Modal */}
      <Modal
        isOpen={statusModalLoan !== null}
        onClose={() => setStatusModalLoan(null)}
        title={`Change Loan Status (${statusModalLoan?.loanId})`}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            Override the status of this loan. Marking as <strong className="text-emerald-700">Completed</strong> will settle the loan and permanently lock the settlement duration.
          </p>

          <Select
            label="Select Status"
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value as LoanStatus)}
            options={[
              { value: 'active', label: 'Active' },
              { value: 'overdue', label: 'Overdue' },
              { value: 'completed', label: 'Completed / Settled' },
              { value: 'cancelled', label: 'Cancelled' },
            ]}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setStatusModalLoan(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                if (statusModalLoan && onStatusChange) {
                  onStatusChange(statusModalLoan.id, newStatus);
                  setStatusModalLoan(null);
                }
              }}
            >
              Update Status
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default LoanList;
