import { HandlerResponse } from '@netlify/functions';
import { requireAuth, AuthenticatedEvent, corsHeaders } from './_lib/auth-middleware';
import { reportRepository } from './_lib/repositories/report.repository';
import { excelExportService } from './_lib/services/excel-export.service';
import { ReportType, ReportFilterParams } from '../../../src/types/report';

export const handler = requireAuth(async (event: AuthenticatedEvent): Promise<HandlerResponse> => {
  const method = event.httpMethod;
  const rawPath = event.path || '';
  const query = event.queryStringParameters || {};

  if (method !== 'GET') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  // Path format: /api/export/:reportType/excel or /api/export/:reportType/csv
  // or query format: ?type=loan-report&format=excel
  const segments = rawPath.split('/').filter(Boolean);
  const lastSegment = (segments[segments.length - 1] || '').toLowerCase();
  const format = (lastSegment === 'excel' || lastSegment === 'csv' ? lastSegment : (query.format || 'excel')) as 'excel' | 'csv';

  const reportTypeCandidate = segments.length >= 2 && (lastSegment === 'excel' || lastSegment === 'csv')
    ? segments[segments.length - 2]
    : (query.type || 'loan-report');

  const reportType = reportTypeCandidate as ReportType;

  try {
    const filters: ReportFilterParams = {
      startDate: query.startDate || undefined,
      endDate: query.endDate || undefined,
      status: query.status || undefined,
      borrowerId: query.borrowerId ? Number(query.borrowerId) : undefined,
      loanId: query.loanId ? Number(query.loanId) : undefined,
      paymentMode: query.paymentMode || undefined,
      year: query.year ? Number(query.year) : undefined,
      search: query.search || undefined,
    };

    let data: unknown[] = [];
    let title = 'Report';

    switch (reportType) {
      case 'capital-statement':
        data = await reportRepository.getCapitalStatement(filters);
        title = 'Capital Statement Report';
        break;
      case 'loan-report':
        data = await reportRepository.getLoanReport(filters);
        title = 'Loan Portfolio Report';
        break;
      case 'borrower-report':
        data = await reportRepository.getBorrowerReport(filters);
        title = 'Borrower Directory Report';
        break;
      case 'payment-report':
        data = await reportRepository.getPaymentReport(filters);
        title = 'Payment Collections Report';
        break;
      case 'outstanding-report':
        data = await reportRepository.getOutstandingReport(filters);
        title = 'Outstanding Balances Report';
        break;
      case 'overdue-report':
        data = await reportRepository.getOverdueReport(filters);
        title = 'Overdue Delinquency Report';
        break;
      case 'interest-report':
        data = await reportRepository.getInterestReport(filters);
        title = 'Interest & Profit Report';
        break;
      case 'monthly-collection':
        data = await reportRepository.getMonthlyCollectionReport(filters.year);
        title = `Monthly Collection Report ${filters.year || new Date().getFullYear()}`;
        break;
      default:
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: `Invalid report type: ${reportType}` }),
        };
    }

    const timestamp = new Date().toISOString().split('T')[0];
    const filenameBase = `${reportType}_${timestamp}`;

    if (format === 'csv') {
      const csvContent = excelExportService.generateReportCSV(reportType, data as Record<string, unknown>[]);
      return {
        statusCode: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filenameBase}.csv"`,
        },
        body: csvContent,
      };
    }

    // Default: Excel (.xlsx)
    const buffer = await excelExportService.generateReportWorkbook(reportType, data as Record<string, unknown>[], {
      title,
      filters: filters as Record<string, unknown>,
    });

    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filenameBase}.xlsx"`,
      },
      body: buffer.toString('base64'),
      isBase64Encoded: true,
    };
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Export API Error:', err);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Internal Server Error',
        message: err.message || 'Failed to export report',
      }),
    };
  }
});
