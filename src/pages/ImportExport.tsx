import React, { useState } from 'react';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import { ImportType, ReportType } from '@/types/report';
import { ImportModal, ImportTemplateCard } from '@/components/reports';
import { useExportReport } from '@/hooks/useReports';
import {
  FileSpreadsheet,
  Download,
  Upload,
  Users,
  HandCoins,
  CreditCard,
  Landmark,
  ShieldCheck,
} from 'lucide-react';

export const ImportExport: React.FC = () => {
  const [selectedImportType, setSelectedImportType] = useState<ImportType>('borrowers');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const exportMutation = useExportReport();

  const handleOpenImport = (type: ImportType) => {
    setSelectedImportType(type);
    setIsImportModalOpen(true);
  };

  const handleQuickExport = (reportType: ReportType) => {
    exportMutation.mutate({
      reportType,
      format: 'excel',
      filters: {},
    });
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-indigo-600" /> Data Migration & Excel Backup
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-0.5">
            Bulk import historical data from spreadsheets, download structured templates, and export full backups
          </p>
        </div>
      </div>

      {/* 1. Bulk Data Import Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Upload className="w-4 h-4 text-indigo-600" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
            1. Excel Data Import & Migration Wizards
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <ImportTemplateCard
            type="borrowers"
            title="Borrowers Import"
            description="Bulk import client profiles, contact numbers, notes, and addresses."
            columns={['fullName', 'phone', 'email', 'address', 'notes', 'status']}
            iconBg="bg-purple-50 text-purple-600"
            onOpenImport={() => handleOpenImport('borrowers')}
          />

          <ImportTemplateCard
            type="loans"
            title="Loans Import"
            description="Migrate historical or existing active loan contracts."
            columns={['borrowerPhone', 'principalAmount', 'interestRate', 'interestRateType', 'loanGivenDate']}
            iconBg="bg-indigo-50 text-indigo-600"
            onOpenImport={() => handleOpenImport('loans')}
          />

          <ImportTemplateCard
            type="payments"
            title="Payments Import"
            description="Import historical repayments, mode of payment, and allocations."
            columns={['loanCustomId', 'paymentDate', 'paymentAmount', 'paymentMode', 'referenceNumber']}
            iconBg="bg-emerald-50 text-emerald-600"
            onOpenImport={() => handleOpenImport('payments')}
          />

          <ImportTemplateCard
            type="capital"
            title="Capital Inflow/Outflow"
            description="Record capital injections, owner withdrawals, and funding pools."
            columns={['transactionDate', 'transactionType', 'amount', 'source', 'referenceNumber']}
            iconBg="bg-amber-50 text-amber-600"
            onOpenImport={() => handleOpenImport('capital')}
          />
        </div>
      </div>

      {/* 2. Instant Excel Data Exports Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Download className="w-4 h-4 text-emerald-600" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
            2. 1-Click Excel (.xlsx) Backup & Full Exports
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 border border-slate-200 shadow-sm space-y-3 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                <HandCoins className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Master Data</span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Loan Portfolio Ledger</h3>
              <p className="text-xs text-slate-500 mt-0.5">All loans with paid and pending breakdown</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickExport('loan-report')}
              isLoading={exportMutation.isPending}
              className="w-full text-xs"
              leftIcon={<Download className="w-3.5 h-3.5" />}
            >
              Export Loans (.xlsx)
            </Button>
          </Card>

          <Card className="p-4 border border-slate-200 shadow-sm space-y-3 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
                <CreditCard className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Ledger</span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Repayment Records</h3>
              <p className="text-xs text-slate-500 mt-0.5">Complete collection transactions history</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickExport('payment-report')}
              isLoading={exportMutation.isPending}
              className="w-full text-xs"
              leftIcon={<Download className="w-3.5 h-3.5" />}
            >
              Export Payments (.xlsx)
            </Button>
          </Card>

          <Card className="p-4 border border-slate-200 shadow-sm space-y-3 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600">
                <Users className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Directory</span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Borrower Directory</h3>
              <p className="text-xs text-slate-500 mt-0.5">Client contacts, total borrowing, and status</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickExport('borrower-report')}
              isLoading={exportMutation.isPending}
              className="w-full text-xs"
              leftIcon={<Download className="w-3.5 h-3.5" />}
            >
              Export Borrowers (.xlsx)
            </Button>
          </Card>

          <Card className="p-4 border border-slate-200 shadow-sm space-y-3 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
                <Landmark className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Capital</span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Capital Statement</h3>
              <p className="text-xs text-slate-500 mt-0.5">Running balance & partner transactions</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickExport('capital-statement')}
              isLoading={exportMutation.isPending}
              className="w-full text-xs"
              leftIcon={<Download className="w-3.5 h-3.5" />}
            >
              Export Capital (.xlsx)
            </Button>
          </Card>
        </div>
      </div>

      {/* Safety & Atomicity Assurance Card */}
      <Card className="p-5 border border-indigo-100 bg-indigo-50/40 rounded-2xl flex items-start gap-4">
        <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-xs shrink-0 mt-0.5">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-indigo-950">Transactional & Safe Data Migration</h3>
          <p className="text-xs text-indigo-900/80 leading-relaxed">
            All Excel imports undergo strict schema validation and duplicate checks before being written to the database.
            Imports execute inside atomic MySQL transactions — if even a single error occurs, the entire batch is safely rolled back to guarantee zero corrupted records.
          </p>
        </div>
      </Card>

      {/* Import Modal */}
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        defaultType={selectedImportType}
      />
    </div>
  );
};

export default ImportExport;
