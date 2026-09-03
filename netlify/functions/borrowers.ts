import { HandlerResponse } from '@netlify/functions';
import { requireAuth, AuthenticatedEvent, corsHeaders } from './_lib/auth-middleware';
import { borrowerRepository } from './_lib/repositories';
import { borrowerSchema, borrowerUpdateSchema } from '../../src/utils/validation';

export const handler = requireAuth(async (event: AuthenticatedEvent): Promise<HandlerResponse> => {
  const method = event.httpMethod;
  const user = event.user;
  const rawPath = event.path || '';
  const query = event.queryStringParameters || {};

  // Extract path segments (e.g. /api/borrowers, /api/borrowers/1, /api/borrowers/search, /api/borrowers/1/stats)
  const segments = rawPath.split('/').filter(Boolean);
  const lastSegment = segments[segments.length - 1] || '';
  const secondLastSegment = segments.length >= 2 ? segments[segments.length - 2] : '';

  const isSearch = lastSegment === 'search' || query.action === 'search';
  const isStats = lastSegment === 'stats' || query.action === 'stats';
  const isLoans = lastSegment === 'loans' || query.action === 'loans';

  let paramId: number | null = null;
  if (!isNaN(Number(lastSegment))) {
    paramId = Number(lastSegment);
  } else if ((isStats || isLoans) && !isNaN(Number(secondLastSegment))) {
    paramId = Number(secondLastSegment);
  } else if (!isNaN(Number(query.id))) {
    paramId = Number(query.id);
  }

  try {
    // ----------------------------------------------------
    // GET /api/borrowers/search (Autocomplete search)
    // ----------------------------------------------------
    if (method === 'GET' && isSearch) {
      const q = String(query.q || query.search || query.query || '').trim();
      const limit = Math.min(50, Math.max(1, Number(query.limit) || 10));

      if (!q) {
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify([]),
        };
      }

      const results = await borrowerRepository.search(q, limit);
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(results),
      };
    }

    // ----------------------------------------------------
    // GET /api/borrowers/:id/stats
    // ----------------------------------------------------
    if (method === 'GET' && paramId !== null && isStats) {
      const borrower = await borrowerRepository.findById(paramId);
      if (!borrower) {
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Not Found', message: `Borrower #${paramId} not found` }),
        };
      }

      const stats = await borrowerRepository.getStats(paramId);
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(stats),
      };
    }

    // ----------------------------------------------------
    // GET /api/borrowers/:id/loans
    // ----------------------------------------------------
    if (method === 'GET' && paramId !== null && isLoans) {
      const borrower = await borrowerRepository.findById(paramId);
      if (!borrower) {
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Not Found', message: `Borrower #${paramId} not found` }),
        };
      }

      const loans = await borrowerRepository.getLoanHistory(paramId);
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(loans),
      };
    }

    // ----------------------------------------------------
    // GET /api/borrowers/:id (Single Borrower with Stats & Loans)
    // ----------------------------------------------------
    if (method === 'GET' && paramId !== null) {
      const borrower = await borrowerRepository.findById(paramId);
      if (!borrower) {
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Not Found', message: `Borrower #${paramId} not found` }),
        };
      }

      const stats = await borrowerRepository.getStats(paramId);
      const loans = await borrowerRepository.getLoanHistory(paramId);

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ ...borrower, stats, loans }),
      };
    }

    // ----------------------------------------------------
    // GET /api/borrowers (Paginated List with Filters)
    // ----------------------------------------------------
    if (method === 'GET') {
      const filters = {
        status: query.status,
        search: query.search || query.q,
        page: query.page ? Number(query.page) : 1,
        limit: query.limit ? Number(query.limit) : 10,
      };

      const result = await borrowerRepository.findAll(filters);
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(result),
      };
    }

    // ----------------------------------------------------
    // POST /api/borrowers (Create Borrower)
    // ----------------------------------------------------
    if (method === 'POST') {
      if (user.role !== 'admin' && user.role !== 'operator') {
        return {
          statusCode: 403,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Forbidden', message: 'Only admin and operator can create borrowers' }),
        };
      }

      if (!event.body) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Bad Request', message: 'Request body is required' }),
        };
      }

      const parsed = JSON.parse(event.body);
      const validation = borrowerSchema.safeParse(parsed);
      if (!validation.success) {
        return {
          statusCode: 422,
          headers: corsHeaders,
          body: JSON.stringify({
            error: 'Validation Error',
            details: validation.error.flatten().fieldErrors,
          }),
        };
      }

      const created = await borrowerRepository.create(validation.data, user.id);
      return {
        statusCode: 201,
        headers: corsHeaders,
        body: JSON.stringify(created),
      };
    }

    // ----------------------------------------------------
    // PUT /api/borrowers/:id (Update Borrower)
    // ----------------------------------------------------
    if (method === 'PUT') {
      if (user.role !== 'admin' && user.role !== 'operator') {
        return {
          statusCode: 403,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Forbidden', message: 'Only admin and operator can update borrowers' }),
        };
      }

      if (paramId === null) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Bad Request', message: 'Valid borrower ID is required in URL' }),
        };
      }

      if (!event.body) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Bad Request', message: 'Request body is required' }),
        };
      }

      const parsed = JSON.parse(event.body);
      const validation = borrowerUpdateSchema.safeParse(parsed);
      if (!validation.success) {
        return {
          statusCode: 422,
          headers: corsHeaders,
          body: JSON.stringify({
            error: 'Validation Error',
            details: validation.error.flatten().fieldErrors,
          }),
        };
      }

      const updated = await borrowerRepository.update(paramId, validation.data, user.id);
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(updated),
      };
    }

    // ----------------------------------------------------
    // DELETE /api/borrowers/:id (Soft Delete)
    // ----------------------------------------------------
    if (method === 'DELETE') {
      if (user.role !== 'admin') {
        return {
          statusCode: 403,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Forbidden', message: 'Only administrators can delete borrowers' }),
        };
      }

      if (paramId === null) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Bad Request', message: 'Valid borrower ID is required in URL' }),
        };
      }

      await borrowerRepository.softDelete(paramId, user.id);
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ success: true, message: `Borrower #${paramId} deleted successfully` }),
      };
    }

    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    const isClientError =
      message.includes('already registered') ||
      message.includes('Cannot delete borrower') ||
      message.includes('already in use') ||
      message.includes('required');

    return {
      statusCode: isClientError ? 400 : 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: isClientError ? 'Bad Request' : 'Server Error',
        message,
      }),
    };
  }
});
