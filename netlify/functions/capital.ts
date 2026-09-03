import { HandlerResponse } from '@netlify/functions';
import { requireAuth, AuthenticatedEvent, corsHeaders } from './_lib/auth-middleware';
import { capitalRepository } from './_lib/repositories';
import { capitalTransactionSchema, capitalUpdateSchema } from '../../src/utils/validation';

export const handler = requireAuth(async (event: AuthenticatedEvent): Promise<HandlerResponse> => {
  const method = event.httpMethod;
  const user = event.user;
  const rawPath = event.path || '';
  const query = event.queryStringParameters || {};

  // Extract subroute and ID if present (e.g. /api/capital, /api/capital/balance, /api/capital/123)
  const segments = rawPath.split('/').filter(Boolean);
  const lastSegment = segments[segments.length - 1];

  const isBalance = lastSegment === 'balance' || query.action === 'balance';
  const isSummary = lastSegment === 'summary' || query.action === 'summary';
  const paramId = !isNaN(Number(lastSegment))
    ? Number(lastSegment)
    : !isNaN(Number(query.id))
    ? Number(query.id)
    : null;

  try {
    // ----------------------------------------------------
    // GET /api/capital/balance
    // ----------------------------------------------------
    if (method === 'GET' && isBalance) {
      const balance = await capitalRepository.getBalance();
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(balance),
      };
    }

    // ----------------------------------------------------
    // GET /api/capital/summary
    // ----------------------------------------------------
    if (method === 'GET' && isSummary) {
      const year = query.year ? Number(query.year) : undefined;
      const summary = await capitalRepository.getSummary(year);
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(summary),
      };
    }

    // ----------------------------------------------------
    // GET /api/capital/:id
    // ----------------------------------------------------
    if (method === 'GET' && paramId !== null) {
      const tx = await capitalRepository.findById(paramId);
      if (!tx) {
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Not Found', message: `Transaction #${paramId} not found` }),
        };
      }
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(tx),
      };
    }

    // ----------------------------------------------------
    // GET /api/capital (List with filters & pagination)
    // ----------------------------------------------------
    if (method === 'GET') {
      const filters = {
        transactionType: query.transactionType || query.type,
        startDate: query.startDate || query.from_date,
        endDate: query.endDate || query.to_date,
        search: query.search || query.q,
        page: query.page ? Number(query.page) : 1,
        limit: query.limit ? Number(query.limit) : 10,
      };

      const result = await capitalRepository.findAll(filters);
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(result),
      };
    }

    // ----------------------------------------------------
    // POST /api/capital (Create transaction - Admin Only)
    // ----------------------------------------------------
    if (method === 'POST') {
      if (user.role !== 'admin') {
        return {
          statusCode: 403,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Forbidden', message: 'Only administrators can record capital transactions' }),
        };
      }

      const body = JSON.parse(event.body || '{}');
      const parseResult = capitalSchema.safeParse(body);
      if (!parseResult.success) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({
            error: 'Validation Error',
            errors: parseResult.error.flatten().fieldErrors,
          }),
        };
      }

      const created = await capitalRepository.create(parseResult.data, user.id);
      return {
        statusCode: 201,
        headers: corsHeaders,
        body: JSON.stringify(created),
      };
    }

    // ----------------------------------------------------
    // PUT /api/capital/:id (Update transaction - Admin Only)
    // ----------------------------------------------------
    if (method === 'PUT') {
      if (user.role !== 'admin') {
        return {
          statusCode: 403,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Forbidden', message: 'Only administrators can update capital transactions' }),
        };
      }

      if (paramId === null) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Bad Request', message: 'Transaction ID is required' }),
        };
      }

      const body = JSON.parse(event.body || '{}');
      const parseResult = capitalUpdateSchema.safeParse(body);
      if (!parseResult.success) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({
            error: 'Validation Error',
            errors: parseResult.error.flatten().fieldErrors,
          }),
        };
      }

      const updated = await capitalRepository.update(paramId, parseResult.data, user.id);
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(updated),
      };
    }

    // ----------------------------------------------------
    // DELETE /api/capital/:id (Soft delete - Admin Only)
    // ----------------------------------------------------
    if (method === 'DELETE') {
      if (user.role !== 'admin') {
        return {
          statusCode: 403,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Forbidden', message: 'Only administrators can delete capital transactions' }),
        };
      }

      if (paramId === null) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Bad Request', message: 'Transaction ID is required' }),
        };
      }

      await capitalRepository.softDelete(paramId, user.id);
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ success: true, message: `Capital transaction #${paramId} deleted successfully` }),
      };
    }

    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  } catch (err: unknown) {
    const errorObj = err as Error;
    console.error(`[Capital API Error on ${method} ${rawPath}]:`, errorObj);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Internal Server Error',
        message: errorObj.message || 'Failed processing capital transaction request',
      }),
    };
  }
});
