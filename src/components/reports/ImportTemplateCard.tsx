import React from 'react';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import { ImportType } from '@/types/report';
import { useDownloadTemplate } from '@/hooks/useReports';
import { Download, FileSpreadsheet } from 'lucide-react';

interface ImportTemplateCardProps {
  type: ImportType;
  title: string;
  description: string;
  columns: string[];
  iconBg?: string;
  onOpenImport?: () => void;
}

export const ImportTemplateCard: React.FC<ImportTemplateCardProps> = ({
  type,
  title,
  description,
  columns,
  iconBg = 'bg-indigo-50 text-indigo-600',
  onOpenImport,
}) => {
  const downloadMutation = useDownloadTemplate();

  return (
    <Card className="p-5 border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between hover:shadow-md transition-all">
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">{title}</h3>
            <p className="text-xs text-slate-500">{description}</p>
          </div>
          <div className={`p-2.5 rounded-xl ${iconBg}`}>
            <FileSpreadsheet className="w-5 h-5" />
          </div>
        </div>

        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
            Supported Columns:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {columns.map((col, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-mono font-medium text-slate-700"
              >
                {col}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
        <Button
          variant="outline"
          size="sm"
          onClick={() => downloadMutation.mutate(type)}
          isLoading={downloadMutation.isPending}
          className="flex-1 text-xs"
          leftIcon={<Download className="w-3.5 h-3.5" />}
        >
          Download Template
        </Button>

        {onOpenImport && (
          <Button
            variant="primary"
            size="sm"
            onClick={onOpenImport}
            className="text-xs bg-indigo-600 hover:bg-indigo-700"
          >
            Import
          </Button>
        )}
      </div>
    </Card>
  );
};

export default ImportTemplateCard;
