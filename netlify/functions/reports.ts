import { HandlerResponse } from '@netlify/functions';
import { requireAuth, AuthenticatedEvent, corsHeaders } from './_lib/auth-middleware';
import { reportRepository } from './_lib/repositories/report.repository';
import { ReportType, ReportFilterParams } from '../../../src/types/report';

export const handler = requireAuth(async (event: AuthenticatedEvent): Promise<HandlerResponse> => {
  const method = event.httpMethod;
  const rawPath = event.path || '';
  const query = event.queryStringParameters || {};

  const segments = rawPath.split('/').filter(Boolean);
  const reportType = (segments[segments.length - 1] || 'loan-report') as ReportType;

  if (method !== 'GET') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

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

    let data: unknown = [];

    switch (reportType) {
      case 'capital-statement':
        data = await reportRepository.getCapitalStatement(filters);
        break;
      case 'loan-report':
        data = await reportRepository.getLoanReport(filters);
        break;
      case 'borrower-report':
        data = await reportRepository.getBorrowerReport(filters);
        break;
      case 'payment-report':
        data = await reportRepository.getPaymentReport(filters);
        break;
      case 'outstanding-report':
        data = await reportRepository.getOutstandingReport(filters);
        break;
      case 'overdue-report':
        data = await reportRepository.getOverdueReport(filters);
        break;
      case 'interest-report':
        data = await reportRepository.getInterestReport(filters);
        break;
      case 'monthly-collection':
        data = await reportRepository.getMonthlyCollectionReport(filters.year);
        break;
      default:
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: `Invalid report type: ${reportType}` }),
        };
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        reportType,
        total: Array.isArray(data) ? data.length : 0,
        data,
      }),
    };
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Reports API Error:', err);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Internal Server Error',
        message: err.message || 'Failed to generate report',
      }),
    };
  }
});
