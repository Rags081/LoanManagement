import React, { useState, useRef } from 'react';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import { ImportType, ImportResult } from '@/types/report';
import { useImportData, useDownloadTemplate } from '@/hooks/useReports';
import { Upload, FileSpreadsheet, Download, AlertCircle, CheckCircle2 } from 'lucide-react';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: ImportType;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  defaultType = 'borrowers',
}) => {
  const [selectedType, setSelectedType] = useState<ImportType>(defaultType);
  const [file, setFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const importMutation = useImportData();
  const templateMutation = useDownloadTemplate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = () => {
      const b64 = reader.result as string;
      setFileBase64(b64);
    };
    reader.readAsDataURL(selected);
  };

  const handleImportSubmit = async () => {
    if (!fileBase64) return;

    try {
      const result = await importMutation.mutateAsync({
        type: selectedType,
        fileBase64,
      });
      setImportResult(result);
    } catch {
      // Error handled by mutation
    }
  };

  const handleDownloadTemplate = () => {
    templateMutation.mutate(selectedType);
  };

  const resetState = () => {
    setFile(null);
    setFileBase64(null);
    setImportResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Import Excel Data" size="lg">
      <div className="space-y-5 p-1">
        {/* Step 1: Select Type */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Select Data Entity to Import
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { type: 'borrowers' as const, label: 'Borrowers' },
              { type: 'loans' as const, label: 'Loans' },
              { type: 'payments' as const, label: 'Payments' },
              { type: 'capital' as const, label: 'Capital' },
            ].map((item) => (
              <button
                key={item.type}
                type="button"
                onClick={() => {
                  setSelectedType(item.type);
                  resetState();
                }}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                  selectedType === item.type
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Template Helper */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span className="text-slate-600 font-medium">Need the correct Excel format?</span>
          </div>
          <button
            type="button"
            onClick={handleDownloadTemplate}
            disabled={templateMutation.isPending}
            className="flex items-center gap-1 font-bold text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" /> Download Template (.xlsx)
          </button>
        </div>

        {/* Step 2: Upload Dropzone */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Upload Excel File (.xlsx)
          </label>
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors ${
              file
                ? 'border-emerald-300 bg-emerald-50/30'
                : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50 hover:bg-slate-50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="p-3 rounded-full bg-white shadow-xs border border-slate-200">
                <Upload className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">
                  {file ? file.name : 'Click to select or drag & drop Excel file'}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {file ? `${(file.size / 1024).toFixed(1)} KB` : 'Supports Microsoft Excel (.xlsx) files up to 10MB'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Validation / Result Message */}
        {importResult && (
          <div
            className={`p-4 rounded-xl border text-xs space-y-2 ${
              importResult.success
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            <div className="flex items-center gap-2 font-bold">
              {importResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600" />
              )}
              <span>{importResult.message}</span>
            </div>

            {/* Error Listing */}
            {importResult.errors && importResult.errors.length > 0 && (
              <div className="space-y-1 max-h-36 overflow-y-auto bg-white/80 p-2.5 rounded-lg border border-rose-200 mt-2">
                <p className="font-bold text-[11px] text-rose-800">Errors encountered:</p>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-rose-700">
                  {importResult.errors.map((err, idx) => (
                    <li key={idx}>
                      {err.row > 0 ? `Row ${err.row}: ` : ''}
                      <span className="font-semibold">{err.field}</span> - {err.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Footer Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button variant="ghost" onClick={handleClose}>
            {importResult?.success ? 'Close' : 'Cancel'}
          </Button>

          <Button
            variant="primary"
            onClick={handleImportSubmit}
            disabled={!file || importMutation.isPending || importResult?.success}
            isLoading={importMutation.isPending}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            Import Data Now
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ImportModal;
