import React from 'react';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Input from '@/components/common/Form/Input';
import Select from '@/components/common/Form/Select';
import { BorrowerFilterParams } from '@/types/borrower';
import { Search, RotateCcw } from 'lucide-react';

interface BorrowerFiltersProps {
  filters: BorrowerFilterParams;
  onChange: (newFilters: BorrowerFilterParams) => void;
  onReset: () => void;
}

export const BorrowerFilters: React.FC<BorrowerFiltersProps> = ({
  filters,
  onChange,
  onReset,
}) => {
  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'blacklisted', label: 'Blacklisted' },
  ];

  return (
    <Card className="p-4 bg-slate-50 border border-slate-200">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
        {/* Search */}
        <div className="sm:col-span-2">
          <Input
            placeholder="Search by name, phone (10 digits), or Borrower ID (BOR-001)..."
            value={filters.search || ''}
            onChange={(e) => onChange({ ...filters, search: e.target.value, page: 1 })}
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
          />
        </div>

        {/* Status Dropdown + Reset */}
        <div className="flex items-center gap-2">
          <Select
            options={statusOptions}
            value={filters.status || 'all'}
            onChange={(e) => onChange({ ...filters, status: e.target.value, page: 1 })}
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

export default BorrowerFilters;
