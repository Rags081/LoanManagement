import React, { useState, useEffect, useRef, useMemo } from 'react';
import Decimal from 'decimal.js';
import Table, { Column } from '@/components/common/Table';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import Select from '@/components/common/Form/Select';
import { LoanWithBorrower, LoanStatus } from '@/types/loan';
import { LoanStatusBadge } from './LoanStatusBadge';
import { formatCurrency, formatDate, calculateCalendarTenure } from '@/utils/formatters';
import { calculateDynamicInterestOutstanding } from '@/utils/interestCalculation';
import { useNavigate } from 'react-router-dom';
import {
  Eye,
  Edit,
  Trash2,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  Clock,
  Calendar,
  Sparkles,
  TrendingUp,
  SlidersHorizontal,
  RotateCcw,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface LoanListProps {
  loans: LoanWithBorrower[];
  allLoans?: LoanWithBorrower[];
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
  isLoading?: boolean;
  onPageChange?: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  onEdit: (loan: LoanWithBorrower) => void;
  onDelete: (id: number) => void;
  onStatusChange?: (id: number, status: LoanStatus) => void;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
    onLimitChange?: (limit: number) => void;
  };
  dayOfMonth?: string;
  onDayOfMonthChange?: (day: string) => void;
}

const COLUMN_STORAGE_KEY = 'loan_table_column_visibility';

const DEFAULT_COLUMN_VISIBILITY: Record<string, boolean> = {
  loanDate: true,
  loanId: true,
  borrower: true,
  principal: true,
  interestTerms: true,
  principalReceived: true,
  interestReceived: true,
  amountReceived: true,
  interestOutstanding: true,
  totalOutstanding: true,
  actualTenure: true,
  status: true,
  actions: true,
};

const getInitialColumnVisibility = (): Record<string, boolean> => {
  try {
    const saved = localStorage.getItem(COLUMN_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...DEFAULT_COLUMN_VISIBILITY, ...parsed, actions: true };
    }
  } catch (err) {
    console.warn('Failed to parse column visibility preferences from localStorage', err);
  }
  return { ...DEFAULT_COLUMN_VISIBILITY };
};

export const LoanList: React.FC<LoanListProps> = ({
  loans,
  allLoans,
  total,
  page,
  limit,
  totalPages,
  isLoading = false,
  onPageChange,
  onLimitChange,
  onEdit,
  onDelete,
  onStatusChange,
  pagination,
  dayOfMonth,
  onDayOfMonthChange,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const canEdit = user?.role === 'admin' || user?.role === 'operator';

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [statusModalLoan, setStatusModalLoan] = useState<LoanWithBorrower | null>(null);
  const [newStatus, setNewStatus] = useState<LoanStatus>('active');

  // Column Visibility State & Popover Ref
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(getInitialColumnVisibility);
  const [isColumnDropdownOpen, setIsColumnDropdownOpen] = useState(false);
  const columnDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (columnDropdownRef.current && !columnDropdownRef.current.contains(event.target as Node)) {
        setIsColumnDropdownOpen(false);
      }
    };
    if (isColumnDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isColumnDropdownOpen]);

  const toggleColumn = (key: string) => {
    if (key === 'actions') return; // Actions column should remain visible for existing operations
    setColumnVisibility((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem(COLUMN_STORAGE_KEY, JSON.stringify(next));
      } catch (err) {
        console.warn('Failed to save column visibility preferences to localStorage', err);
      }
      return next;
    });
  };

  const handleSelectAllColumns = () => {
    const allVisible = columns.reduce<Record<string, boolean>>((acc, col) => {
      acc[col.key] = true;
      return acc;
    }, {});
    setColumnVisibility(allVisible);
    try {
      localStorage.setItem(COLUMN_STORAGE_KEY, JSON.stringify(allVisible));
    } catch (err) {
      console.warn('Failed to save column visibility preferences to localStorage', err);
    }
  };

  const handleResetColumns = () => {
    setColumnVisibility(DEFAULT_COLUMN_VISIBILITY);
    try {
      localStorage.setItem(COLUMN_STORAGE_KEY, JSON.stringify(DEFAULT_COLUMN_VISIBILITY));
    } catch (err) {
      console.warn('Failed to reset column visibility preferences to localStorage', err);
    }
  };

  const curPage = pagination?.currentPage || page || 1;
  const numPages = Math.max(1, pagination?.totalPages || totalPages || 1);
  const totalCount = pagination?.totalItems !== undefined ? pagination.totalItems : (total !== undefined ? total : loans.length);
  const pageSize = pagination?.itemsPerPage || limit || 10;
  const handlePageChange = pagination?.onPageChange || onPageChange;
  const handleLimitChange = pagination?.onLimitChange || onLimitChange;

  // Calculate totals across the complete filtered dataset (not just visible page)
  const datasetForTotals = allLoans && allLoans.length > 0 ? allLoans : loans;

  const columnTotals = useMemo(() => {
    let totalInterestReceived = new Decimal(0);
    let totalAmountReceived = new Decimal(0);
    let totalInterestOutstanding = new Decimal(0);

    for (const l of datasetForTotals) {
      totalInterestReceived = totalInterestReceived.plus(Number(l.interestReceived || 0));
      totalAmountReceived = totalAmountReceived.plus(Number(l.totalReceived || 0));
      const dynamicRes = calculateDynamicInterestOutstanding(l);
      totalInterestOutstanding = totalInterestOutstanding.plus(dynamicRes.interestOutstanding);
    }

    return {
      interestReceived: totalInterestReceived.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber(),
      amountReceived: totalAmountReceived.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber(),
      interestOutstanding: totalInterestOutstanding.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber(),
    };
  }, [datasetForTotals]);

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
      key: 'interestOutstanding',
      header: 'Interest Outstanding (₹)',
      render: (loan: LoanWithBorrower) => {
        const result = calculateDynamicInterestOutstanding(loan);
        const isComp = loan.status === 'completed' || loan.isSettled || result.interestOutstanding === 0;

        return (
          <div>
            {isComp ? (
              <span className="text-xs font-medium text-slate-400">
                {formatCurrency(0)}
              </span>
            ) : (
              <div>
                <span
                  className={`text-xs font-black block ${
                    result.isDurationOverOneMonth ? 'text-red-600' : 'text-slate-900'
                  }`}
                  title={`Total: ${formatCurrency(result.interestOutstanding)}`}
                >
                  {result.breakdownText}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">
                  ({result.unpaidElapsedDurationText})
                </span>
              </div>
            )}
          </div>
        );
      },
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

  const visibleColumns = columns.filter((col) => columnVisibility[col.key] !== false);

  const columnsWithFooter: Column<LoanWithBorrower>[] = visibleColumns.map((col, idx) => {
    if (idx === 0) {
      return {
        ...col,
        footer: (
          <span className="font-black text-slate-900 text-xs tracking-wider uppercase">
            TOTAL
          </span>
        ),
      };
    }
    if (col.key === 'interestReceived') {
      return {
        ...col,
        footer: (
          <span className="font-black text-slate-900 text-xs">
            {formatCurrency(columnTotals.interestReceived)}
          </span>
        ),
      };
    }
    if (col.key === 'amountReceived') {
      return {
        ...col,
        footer: (
          <span className="font-black text-slate-900 text-xs">
            {formatCurrency(columnTotals.amountReceived)}
          </span>
        ),
      };
    }
    if (col.key === 'interestOutstanding') {
      return {
        ...col,
        footer: (
          <span className="font-black text-slate-900 text-xs">
            {formatCurrency(columnTotals.interestOutstanding)}
          </span>
        ),
      };
    }
    return {
      ...col,
      footer: null,
    };
  });

  const renderPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (numPages <= 5) {
      for (let i = 1; i <= numPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (curPage > 3) pages.push('ellipsis-start');

      const start = Math.max(2, curPage - 1);
      const end = Math.min(numPages - 1, curPage + 1);
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (curPage < numPages - 2) pages.push('ellipsis-end');
      pages.push(numPages);
    }

    return pages.map((p, idx) => {
      if (typeof p === 'string') {
        return (
          <span key={`ellipsis-${idx}`} className="px-2 py-1 text-xs text-slate-400 select-none">
            …
          </span>
        );
      }
      const isCurrent = p === curPage;
      return (
        <button
          key={p}
          type="button"
          onClick={() => handlePageChange && handlePageChange(p)}
          disabled={isCurrent}
          aria-current={isCurrent ? 'page' : undefined}
          className={`min-w-[32px] h-8 px-2 flex items-center justify-center rounded-lg text-xs font-semibold transition-colors ${
            isCurrent
              ? 'bg-indigo-600 text-white shadow-sm font-bold'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          {p}
        </button>
      );
    });
  };

  return (
    <div className="space-y-4">
      {/* Table Top Control Bar: Total loans + Column Visibility Dropdown */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
        <div className="text-xs font-medium text-slate-500">
          Showing <strong className="text-slate-800">{loans.length}</strong> loaded of{' '}
          <strong className="text-slate-800">{totalCount}</strong> total loans
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {onDayOfMonthChange && (
            <div className="flex items-center gap-1.5">
              <label htmlFor="table-day-filter" className="text-xs font-semibold text-slate-600 whitespace-nowrap">
                Filter by Day:
              </label>
              <select
                id="table-day-filter"
                value={dayOfMonth || 'all'}
                onChange={(e) => onDayOfMonthChange(e.target.value)}
                className="text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm cursor-pointer hover:border-slate-400 transition-colors"
              >
                <option value="all">All Days</option>
                {Array.from({ length: 31 }, (_, i) => {
                  const day = String(i + 1).padStart(2, '0');
                  return (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          {/* Column Visibility Dropdown */}
          <div className="relative inline-block" ref={columnDropdownRef}>
          <button
            type="button"
            id="column-visibility-button"
            onClick={() => setIsColumnDropdownOpen((prev) => !prev)}
            aria-expanded={isColumnDropdownOpen}
            aria-label="Customize Column Visibility"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
              isColumnDropdownOpen
                ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-sm'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
            <span>Columns</span>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${isColumnDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isColumnDropdownOpen && (
            <div
              className="absolute right-0 mt-1.5 w-64 bg-white rounded-xl shadow-xl border border-slate-200 z-50 py-2 animate-in fade-in zoom-in-95 duration-100"
              role="menu"
              aria-orientation="vertical"
              aria-labelledby="column-visibility-button"
            >
              <div className="px-3 pb-2 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">Customize Columns</span>
                <span className="text-[10px] text-slate-400 font-medium">
                  {visibleColumns.length} of {columns.length} visible
                </span>
              </div>

              {/* Quick Actions */}
              <div className="px-3 py-1.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 text-[11px]">
                <button
                  type="button"
                  onClick={handleSelectAllColumns}
                  className="font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={handleResetColumns}
                  className="text-slate-600 hover:text-slate-800 flex items-center gap-1 transition-colors"
                >
                  <RotateCcw className="w-3 h-3 text-slate-400" />
                  <span>Reset to Default</span>
                </button>
              </div>

              {/* Checkboxes List */}
              <div className="max-h-64 overflow-y-auto py-1 px-1 divide-y divide-slate-50">
                {columns.map((col) => {
                  const isChecked = columnVisibility[col.key] !== false;
                  const isActions = col.key === 'actions';

                  return (
                    <label
                      key={col.key}
                      className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                        isChecked ? 'text-slate-800 hover:bg-slate-50' : 'text-slate-400 hover:bg-slate-50'
                      } ${isActions ? 'cursor-not-allowed opacity-80' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        disabled={isActions}
                        onChange={() => toggleColumn(col.key)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                      />
                      <span className="flex-1 font-medium select-none truncate">
                        {col.header}
                      </span>
                      {isActions && (
                        <span className="text-[10px] text-slate-400 font-normal">
                          (Required)
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <Table
          columns={columnsWithFooter}
          data={loans}
          keyExtractor={(item) => item.id}
          isLoading={isLoading}
          emptyMessage="No loans found. Disburse a new loan to get started."
        />

        {/* Working Pagination Bar */}
        {handlePageChange && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-6 py-4 border-t border-slate-200 bg-slate-50/75">
            {/* Record Summary & Rows-per-page Dropdown */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
              <div>
                {totalCount === 0 ? (
                  <span>Showing 0–0 of 0 loans</span>
                ) : (
                  <span>
                    Showing{' '}
                    <strong className="text-slate-800">
                      {(curPage - 1) * pageSize + 1}–{Math.min(curPage * pageSize, totalCount)}
                    </strong>{' '}
                    of <strong className="text-slate-800">{totalCount}</strong> loans
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <label htmlFor="loans-rows-per-page" className="text-slate-500 whitespace-nowrap">
                  Rows per page:
                </label>
                <select
                  id="loans-rows-per-page"
                  value={pageSize}
                  onChange={(e) => {
                    const newLimit = Number(e.target.value);
                    if (handleLimitChange) {
                      handleLimitChange(newLimit);
                    }
                  }}
                  className="text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm cursor-pointer hover:border-slate-400 transition-colors"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            {/* Navigation Controls: Previous, Page Numbers, Next */}
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                disabled={curPage <= 1 || isLoading}
                onClick={() => handlePageChange(curPage - 1)}
                leftIcon={<ChevronLeft className="w-4 h-4" />}
              >
                Previous
              </Button>

              {/* Clickable Page Number Buttons */}
              <div className="hidden sm:flex items-center gap-1">
                {renderPageNumbers()}
              </div>

              <span className="text-xs font-medium text-slate-600 px-1 sm:hidden">
                Page {curPage} of {numPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                disabled={curPage >= numPages || isLoading}
                onClick={() => handlePageChange(curPage + 1)}
                rightIcon={<ChevronRight className="w-4 h-4" />}
              >
                Next
              </Button>

              <span className="text-xs text-slate-500 hidden md:inline ml-2">
                (Page {curPage} of {numPages})
              </span>
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
