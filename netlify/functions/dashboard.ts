import { HandlerResponse } from '@netlify/functions';
import { requireAuth, AuthenticatedEvent, corsHeaders } from './_lib/auth-middleware';
import { dashboardRepository } from './_lib/repositories/dashboard.repository';

export const handler = requireAuth(async (event: AuthenticatedEvent): Promise<HandlerResponse> => {
  const method = event.httpMethod;
  const rawPath = event.path || '';
  const query = event.queryStringParameters || {};

  const segments = rawPath.split('/').filter(Boolean);
  const lastSegment = segments[segments.length - 1] || '';

  if (method !== 'GET') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    // 1. GET /api/dashboard/capital
    if (lastSegment === 'capital') {
      const capital = await dashboardRepository.getCapitalMetrics();
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(capital),
      };
    }

    // 2. GET /api/dashboard/loans
    if (lastSegment === 'loans') {
      const loans = await dashboardRepository.getLoanMetrics();
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(loans),
      };
    }

    // 3. GET /api/dashboard/collections
    if (lastSegment === 'collections') {
      const collections = await dashboardRepository.getCollectionMetrics();
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(collections),
      };
    }

    // 4. GET /api/dashboard/profit
    if (lastSegment === 'profit') {
      const profit = await dashboardRepository.getProfitMetrics();
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(profit),
      };
    }

    // 5. GET /api/dashboard/trends?period=daily|weekly|monthly
    if (lastSegment === 'trends') {
      const period = (query.period === 'daily' || query.period === 'weekly' || query.period === 'monthly')
        ? query.period
        : 'monthly';

      const [loans, collections, outstanding] = await Promise.all([
        dashboardRepository.getLoansOverTime(period),
        dashboardRepository.getCollectionsOverTime(period),
        dashboardRepository.getOutstandingTrend(period),
      ]);

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          period,
          loans,
          collections,
          outstanding,
        }),
      };
    }

    // 6. GET /api/dashboard/recent-activity?limit=10
    if (lastSegment === 'recent-activity') {
      const limit = query.limit ? Number(query.limit) : 10;
      const activity = await dashboardRepository.getRecentActivity(limit);
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(activity),
      };
    }

    // 7. GET /api/dashboard/overdue
    if (lastSegment === 'overdue') {
      const overdue = await dashboardRepository.getOverdueAlert();
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(overdue),
      };
    }

    // 8. GET /api/dashboard/metrics (or default /api/dashboard)
    const metrics = await dashboardRepository.getAllMetrics();
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(metrics),
    };
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Dashboard API Error:', err);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Internal Server Error',
        message: err.message || 'An unexpected error occurred in Dashboard Module',
      }),
    };
  }
});
