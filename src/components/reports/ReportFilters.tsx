import React from 'react';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import { ReportType, ReportFilterParams } from '@/types/report';
import { Search, FileSpreadsheet, FileText, Printer, RotateCcw } from 'lucide-react';

interface ReportFiltersProps {
  reportType: ReportType;
  filters: ReportFilterParams;
  onFilterChange: (filters: ReportFilterParams) => void;
  onExportExcel: () => void;
  onExportCSV: () => void;
  onPrint: () => void;
  isExporting?: boolean;
}

export const ReportFilters: React.FC<ReportFiltersProps> = ({
  reportType,
  filters,
  onFilterChange,
  onExportExcel,
  onExportCSV,
  onPrint,
  isExporting = false,
}) => {
  const handleChange = (field: keyof ReportFilterParams, value: unknown) => {
    onFilterChange({ ...filters, [field]: value || undefined });
  };

  const handleReset = () => {
    onFilterChange({});
  };

  const showStatusFilter = ['loan-report', 'payment-report'].includes(reportType);
  const showDateFilter = ['capital-statement', 'loan-report', 'payment-report', 'interest-report'].includes(reportType);
  const showYearFilter = reportType === 'monthly-collection';

  return (
    <Card className="p-4 border border-slate-200 shadow-sm space-y-4 no-print">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Input Filters */}
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Keyword Search */}
          <div className="relative min-w-[200px] flex-1 sm:flex-initial">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search records..."
              value={filters.search || ''}
              onChange={(e) => handleChange('search', e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          {/* Date Range Start */}
          {showDateFilter && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">From:</span>
              <input
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => handleChange('startDate', e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>
          )}

          {/* Date Range End */}
          {showDateFilter && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">To:</span>
              <input
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => handleChange('endDate', e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>
          )}

          {/* Status Filter */}
          {showStatusFilter && (
            <select
              value={filters.status || 'all'}
              onChange={(e) => handleChange('status', e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              <option value="all">All Statuses</option>
              {reportType === 'loan-report' && (
                <>
                  <option value="active">Active</option>
                  <option value="overdue">Overdue</option>
                  <option value="completed">Completed</option>
                </>
              )}
              {reportType === 'payment-report' && (
                <>
                  <option value="paid">Valid Payments</option>
                  <option value="voided">Voided Transactions</option>
                </>
              )}
            </select>
          )}

          {/* Year Filter */}
          {showYearFilter && (
            <select
              value={filters.year || new Date().getFullYear()}
              onChange={(e) => handleChange('year', Number(e.target.value))}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              {[2024, 2025, 2026, 2027, 2028].map((y) => (
                <option key={y} value={y}>
                  Year {y}
                </option>
              ))}
            </select>
          )}

          {/* Reset Filters */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-xs text-slate-500 hover:text-slate-900"
            leftIcon={<RotateCcw className="w-3 h-3" />}
          >
            Reset
          </Button>
        </div>

        {/* Right: Export & Print Triggers */}
        <div className="flex items-center gap-2 self-end lg:self-center">
          <Button
            variant="outline"
            size="sm"
            onClick={onPrint}
            className="text-xs"
            leftIcon={<Printer className="w-3.5 h-3.5 text-slate-600" />}
          >
            Print / PDF
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onExportCSV}
            isLoading={isExporting}
            className="text-xs"
            leftIcon={<FileText className="w-3.5 h-3.5 text-slate-600" />}
          >
            CSV
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={onExportExcel}
            isLoading={isExporting}
            className="text-xs bg-emerald-600 hover:bg-emerald-700"
            leftIcon={<FileSpreadsheet className="w-3.5 h-3.5" />}
          >
            Export Excel (.xlsx)
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default ReportFilters;
