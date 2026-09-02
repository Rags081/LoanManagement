import React from 'react';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Input from '@/components/common/Form/Input';
import Select from '@/components/common/Form/Select';
import { CapitalFilterParams } from '@/types/capital';
import { Search, RotateCcw } from 'lucide-react';

interface CapitalFiltersProps {
  filters: CapitalFilterParams;
  onChange: (newFilters: CapitalFilterParams) => void;
  onReset: () => void;
}

export const CapitalFilters: React.FC<CapitalFiltersProps> = ({
  filters,
  onChange,
  onReset,
}) => {
  const typeOptions = [
    { value: 'all', label: 'All Transaction Types' },
    { value: 'capital_given', label: 'Capital Given (Deposit)' },
    { value: 'capital_returned', label: 'Capital Returned (Withdrawal)' },
    { value: 'adjustment', label: 'Adjustment' },
  ];

  return (
    <Card className="p-4 bg-slate-50 border border-slate-200">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
        {/* Search */}
        <Input
          placeholder="Search by ID, note, reference..."
          value={filters.search || ''}
          onChange={(e) => onChange({ ...filters, search: e.target.value, page: 1 })}
          leftIcon={<Search className="w-4 h-4 text-slate-400" />}
        />

        {/* Type Dropdown */}
        <Select
          options={typeOptions}
          value={filters.transactionType || 'all'}
          onChange={(e) => onChange({ ...filters, transactionType: e.target.value, page: 1 })}
        />

        {/* Start Date */}
        <Input
          type="date"
          value={filters.startDate || ''}
          onChange={(e) => onChange({ ...filters, startDate: e.target.value, page: 1 })}
        />

        {/* End Date + Reset Button */}
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={filters.endDate || ''}
            onChange={(e) => onChange({ ...filters, endDate: e.target.value, page: 1 })}
            className="flex-1"
          />
          <Button
            variant="secondary"
            onClick={onReset}
            title="Reset Filters"
            className="p-2.5 shrink-0"
          >
            <RotateCcw className="w-4 h-4 text-slate-600" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default CapitalFilters;
