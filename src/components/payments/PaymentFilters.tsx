import React from 'react';
import Input from '@/components/common/Form/Input';
import Select from '@/components/common/Form/Select';
import Button from '@/components/common/Button';
import { PaymentFilterParams, PaymentMode } from '@/types/payment';
import { Search, RotateCcw, Calendar, Filter } from 'lucide-react';

interface PaymentFiltersProps {
  filters: PaymentFilterParams;
  onFilterChange: (filters: PaymentFilterParams | ((prev: PaymentFilterParams) => PaymentFilterParams)) => void;
  onReset: () => void;
}

export const PaymentFilters: React.FC<PaymentFiltersProps> = ({
  filters,
  onFilterChange,
  onReset,
}) => {
  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-indigo-600" />
          <h2 className="text-sm font-bold text-slate-900">Filter Payments</h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          className="text-xs text-slate-500 hover:text-slate-800"
        >
          Reset Filters
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Search */}
        <div className="lg:col-span-2">
          <Input
            placeholder="Search payment ID, loan ID, borrower..."
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
            value={filters.search || ''}
            onChange={(e) =>
              onFilterChange((prev) => ({ ...prev, search: e.target.value, page: 1 }))
            }
          />
        </div>

        {/* Payment Mode */}
        <div>
          <Select
            options={[
              { value: 'all', label: 'All Payment Modes' },
              { value: 'cash', label: 'Cash Payment' },
              { value: 'upi', label: 'UPI Transfer' },
              { value: 'bank_transfer', label: 'Bank Transfer' },
              { value: 'other', label: 'Other / Cheque' },
            ]}
            value={filters.paymentMode || 'all'}
            onChange={(e) =>
              onFilterChange((prev) => ({
                ...prev,
                paymentMode: e.target.value as PaymentMode | 'all',
                page: 1,
              }))
            }
          />
        </div>

        {/* Start Date */}
        <div>
          <Input
            type="date"
            placeholder="From Date"
            leftIcon={<Calendar className="w-4 h-4 text-slate-400" />}
            value={filters.startDate || ''}
            onChange={(e) =>
              onFilterChange((prev) => ({ ...prev, startDate: e.target.value, page: 1 }))
            }
          />
        </div>

        {/* End Date */}
        <div>
          <Input
            type="date"
            placeholder="To Date"
            leftIcon={<Calendar className="w-4 h-4 text-slate-400" />}
            value={filters.endDate || ''}
            onChange={(e) =>
              onFilterChange((prev) => ({ ...prev, endDate: e.target.value, page: 1 }))
            }
          />
        </div>
      </div>
    </div>
  );
};

export default PaymentFilters;
