import React, { useState } from 'react';
import {
  ReportType,
  ReportFilterParams,
} from '@/types/report';
import {
  ReportFilters,
  ReportSummaryCards,
  ReportTable,
  ImportModal,
} from '@/components/reports';
import { useReportData, useExportReport } from '@/hooks/useReports';
import Button from '@/components/common/Button';
import {
  FileBarChart,
  HandCoins,
  CreditCard,
  Landmark,
  Users,
  AlertTriangle,
  TrendingUp,
  Calendar,
  Upload,
} from 'lucide-react';

export const Reports: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ReportType>('loan-report');
  const [filters, setFilters] = useState<ReportFilterParams>({});
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Queries
  const { data: reportResponse, isLoading } = useReportData(activeTab, filters);
  const exportMutation = useExportReport();

  const reportData = reportResponse?.data || [];

  const handleExportExcel = () => {
    exportMutation.mutate({
      reportType: activeTab,
      format: 'excel',
      filters,
    });
  };

  const handleExportCSV = () => {
    exportMutation.mutate({
      reportType: activeTab,
      format: 'csv',
      filters,
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const tabs: { type: ReportType; label: string; icon: React.ReactNode }[] = [
    { type: 'loan-report', label: 'Loan Portfolio', icon: <HandCoins className="w-4 h-4" /> },
    { type: 'payment-report', label: 'Repayments & Collections', icon: <CreditCard className="w-4 h-4" /> },
    { type: 'capital-statement', label: 'Capital Ledger', icon: <Landmark className="w-4 h-4" /> },
    { type: 'borrower-report', label: 'Borrower Directory', icon: <Users className="w-4 h-4" /> },
    { type: 'outstanding-report', label: 'Outstanding Balances', icon: <AlertTriangle className="w-4 h-4" /> },
    { type: 'overdue-report', label: 'Overdue Delinquency', icon: <AlertTriangle className="w-4 h-4 text-rose-500" /> },
    { type: 'interest-report', label: 'Interest & Profit', icon: <TrendingUp className="w-4 h-4 text-emerald-500" /> },
    { type: 'monthly-collection', label: 'Monthly Summary', icon: <Calendar className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-5 no-print">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <FileBarChart className="w-6 h-6 text-indigo-600" /> Financial Reports & Audits
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-0.5">
            Comprehensive financial statements, loan performance analysis, collection summaries, and Excel exports
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsImportModalOpen(true)}
          className="self-start sm:self-auto text-xs"
          leftIcon={<Upload className="w-3.5 h-3.5 text-indigo-600" />}
        >
          Import Excel Data
        </Button>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200 no-print">
        {tabs.map((tab) => (
          <button
            key={tab.type}
            onClick={() => {
              setActiveTab(tab.type);
              setFilters({});
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === tab.type
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Dynamic Summary Cards */}
      <ReportSummaryCards
        reportType={activeTab}
        data={reportData as Record<string, unknown>[]}
        isLoading={isLoading}
      />

      {/* Filter Bar */}
      <ReportFilters
        reportType={activeTab}
        filters={filters}
        onFilterChange={setFilters}
        onExportExcel={handleExportExcel}
        onExportCSV={handleExportCSV}
        onPrint={handlePrint}
        isExporting={exportMutation.isPending}
      />

      {/* Printable Report Data Table */}
      <ReportTable
        reportType={activeTab}
        data={reportData as Record<string, unknown>[]}
        isLoading={isLoading}
      />

      {/* Import Modal */}
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />
    </div>
  );
};

export default Reports;
