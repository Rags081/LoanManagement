import apiClient from './client';
import { saveAs } from 'file-saver';
import {
  ReportType,
  ReportFilterParams,
  ImportType,
  ImportResult,
} from '@/types/report';

export const reportsApi = {
  /**
   * Fetch report data in JSON format
   */
  getReport: async <T = Record<string, unknown>>(
    reportType: ReportType,
    params: ReportFilterParams = {}
  ) => {
    return apiClient.get<{ reportType: ReportType; total: number; data: T[] }>(
      `/reports/${reportType}`,
      { params }
    );
  },

  /**
   * Download Excel report (.xlsx)
   */
  exportExcel: async (reportType: ReportType, params: ReportFilterParams = {}) => {
    const response = await apiClient.get(`/export/${reportType}/excel`, {
      params,
      responseType: 'blob',
    });

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${reportType}_${timestamp}.xlsx`;
    saveAs(new Blob([response.data]), filename);
  },

  /**
   * Download CSV report (.csv)
   */
  exportCSV: async (reportType: ReportType, params: ReportFilterParams = {}) => {
    const response = await apiClient.get(`/export/${reportType}/csv`, {
      params,
      responseType: 'blob',
    });

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${reportType}_${timestamp}.csv`;
    saveAs(new Blob([response.data], { type: 'text/csv;charset=utf-8' }), filename);
  },

  /**
   * Download Import Template (.xlsx)
   */
  downloadTemplate: async (type: ImportType) => {
    const response = await apiClient.get('/import/template', {
      params: { type },
      responseType: 'blob',
    });

    const filename = `${type}_import_template.xlsx`;
    saveAs(new Blob([response.data]), filename);
  },

  /**
   * Import data from Excel file (via base64)
   */
  importData: async (type: ImportType, fileBase64: string) => {
    return apiClient.post<ImportResult>(`/import/${type}`, {
      fileBase64,
    });
  },
};

export default reportsApi;
