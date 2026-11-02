import React from 'react';
import Input from '@/components/common/Form/Input';
import Select from '@/components/common/Form/Select';
import Button from '@/components/common/Button';
import { LoanFilterParams } from '@/types/loan';
import { Search, RotateCcw } from 'lucide-react';

interface LoanFiltersProps {
  filters: LoanFilterParams;
  onFilterChange: (filters: LoanFilterParams) => void;
  onReset: () => void;
}

export const LoanFilters: React.FC<LoanFiltersProps> = ({
  filters,
  onFilterChange,
  onReset,
}) => {
  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'active', label: 'Active' },
    { value: 'overdue', label: 'Overdue' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  const dayOptions = [
    { value: 'all', label: 'All Days' },
    ...Array.from({ length: 31 }, (_, i) => {
      const day = String(i + 1).padStart(2, '0');
      return { value: day, label: day };
    }),
  ];

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {/* Search */}
        <div className="col-span-1 sm:col-span-2">
          <Input
            placeholder="Search by Loan ID (LN-001), Borrower Name, or Phone..."
            value={filters.search || ''}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value, page: 1 })}
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
          />
        </div>

        {/* Status Filter */}
        <div>
          <Select
            options={statusOptions}
            value={filters.status || 'all'}
            onChange={(e) =>
              onFilterChange({
                ...filters,
                status: e.target.value === 'all' ? undefined : e.target.value,
                page: 1,
              })
            }
          />
        </div>

        {/* Reset Button */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={onReset}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            className="w-full"
          >
            Reset Filters
          </Button>
        </div>
      </div>

      {/* Date Range & Day Filter Sub-row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">From Date</label>
          <Input
            type="date"
            value={filters.startDate || ''}
            onChange={(e) => onFilterChange({ ...filters, startDate: e.target.value, page: 1 })}
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">To Date</label>
          <Input
            type="date"
            value={filters.endDate || ''}
            onChange={(e) => onFilterChange({ ...filters, endDate: e.target.value, page: 1 })}
          />
        </div>

        <div>
          <Select
            label="Filter by Day"
            options={dayOptions}
            value={filters.dayOfMonth || 'all'}
            onChange={(e) =>
              onFilterChange({
                ...filters,
                dayOfMonth: e.target.value,
                page: 1,
              })
            }
          />
        </div>
      </div>
    </div>
  );
};

export default LoanFilters;
