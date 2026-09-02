import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import reportsApi from '@/api/reports';
import {
  ReportType,
  ReportFilterParams,
  ImportType,
  ImportResult,
} from '@/types/report';
import { LOAN_KEYS } from './useLoans';
import { BORROWER_KEYS } from './useBorrowers';
import { PAYMENT_KEYS } from './usePayments';
import { CAPITAL_KEYS } from './useCapital';
import { DASHBOARD_KEYS } from './useDashboard';

export const REPORT_KEYS = {
  all: ['reports'] as const,
  data: (type: ReportType, filters: ReportFilterParams) =>
    [...REPORT_KEYS.all, type, filters] as const,
};

export const useReportData = <T = Record<string, unknown>>(
  reportType: ReportType,
  filters: ReportFilterParams = {}
) => {
  return useQuery({
    queryKey: REPORT_KEYS.data(reportType, filters),
    queryFn: async () => {
      const response = await reportsApi.getReport<T>(reportType, filters);
      return response.data;
    },
  });
};

export const useExportReport = () => {
  return useMutation({
    mutationFn: async ({
      reportType,
      format,
      filters,
    }: {
      reportType: ReportType;
      format: 'excel' | 'csv';
      filters: ReportFilterParams;
    }) => {
      if (format === 'csv') {
        await reportsApi.exportCSV(reportType, filters);
      } else {
        await reportsApi.exportExcel(reportType, filters);
      }
    },
    onSuccess: (_, variables) => {
      toast.success(`${variables.format.toUpperCase()} report exported successfully!`);
    },
    onError: (err: unknown) => {
      toast.error((err as Error).message || 'Failed to export report');
    },
  });
};

export const useDownloadTemplate = () => {
  return useMutation({
    mutationFn: async (type: ImportType) => {
      await reportsApi.downloadTemplate(type);
    },
    onSuccess: (_, type) => {
      toast.success(`${type} Excel template downloaded!`);
    },
    onError: (err: unknown) => {
      toast.error((err as Error).message || 'Failed to download template');
    },
  });
};

export const useImportData = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      type,
      fileBase64,
    }: {
      type: ImportType;
      fileBase64: string;
    }): Promise<ImportResult> => {
      const response = await reportsApi.importData(type, fileBase64);
      return response.data;
    },
    onSuccess: (result, variables) => {
      if (result.success) {
        toast.success(result.message || 'Data imported successfully!');

        // Invalidate affected queries
        if (variables.type === 'borrowers') queryClient.invalidateQueries({ queryKey: BORROWER_KEYS.all });
        if (variables.type === 'loans') queryClient.invalidateQueries({ queryKey: LOAN_KEYS.all });
        if (variables.type === 'payments') {
          queryClient.invalidateQueries({ queryKey: PAYMENT_KEYS.all });
          queryClient.invalidateQueries({ queryKey: LOAN_KEYS.all });
        }
        if (variables.type === 'capital') queryClient.invalidateQueries({ queryKey: CAPITAL_KEYS.all });

        queryClient.invalidateQueries({ queryKey: DASHBOARD_KEYS.all });
        queryClient.invalidateQueries({ queryKey: REPORT_KEYS.all });
      } else {
        toast.error(result.message || 'Import failed with validation errors');
      }
    },
    onError: (err: unknown) => {
      toast.error((err as Error).message || 'Import operation failed');
    },
  });
};
