import { HandlerResponse } from '@netlify/functions';
import { requireAuth, AuthenticatedEvent, corsHeaders } from './_lib/auth-middleware';
import { loanRepository, borrowerRepository } from './_lib/repositories';
import { loanSchema, loanUpdateSchema } from '../../src/utils/validation';

export const handler = requireAuth(async (event: AuthenticatedEvent): Promise<HandlerResponse> => {
  const method = event.httpMethod;
  const user = event.user;
  const rawPath = event.path || '';
  const query = event.queryStringParameters || {};

  // Extract path segments (e.g. /api/loans, /api/loans/1, /api/loans/summary, /api/loans/1/payments, /api/loans/1/outstanding, /api/loans/1/status)
  const segments = rawPath.split('/').filter(Boolean);
  const lastSegment = segments[segments.length - 1] || '';
  const secondLastSegment = segments.length >= 2 ? segments[segments.length - 2] : '';

  const isSummary = lastSegment === 'summary' || query.action === 'summary';
  const isPayments = lastSegment === 'payments' || query.action === 'payments';
  const isOutstanding = lastSegment === 'outstanding' || query.action === 'outstanding';
  const isStatusUpdate = lastSegment === 'status' || query.action === 'status';

  let paramId: number | null = null;
  if (!isNaN(Number(lastSegment))) {
    paramId = Number(lastSegment);
  } else if ((isPayments || isOutstanding || isStatusUpdate) && !isNaN(Number(secondLastSegment))) {
    paramId = Number(secondLastSegment);
  } else if (!isNaN(Number(query.id))) {
    paramId = Number(query.id);
  }

  try {
    // ----------------------------------------------------
    // GET /api/loans/summary (Portfolio stats)
    // ----------------------------------------------------
    if (method === 'GET' && isSummary) {
      const filters = {
        borrowerId: query.borrowerId ? Number(query.borrowerId) : undefined,
        status: query.status,
        startDate: query.startDate || query.from_date,
        endDate: query.endDate || query.to_date,
        minRate: query.minRate ? Number(query.minRate) : undefined,
        maxRate: query.maxRate ? Number(query.maxRate) : undefined,
        search: query.search || query.q,
      };
      const summary = await loanRepository.getLoanSummary(filters);
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(summary),
      };
    }

    // ----------------------------------------------------
    // GET /api/loans/:id/payments
    // ----------------------------------------------------
    if (method === 'GET' && paramId !== null && isPayments) {
      const loan = await loanRepository.findById(paramId);
      if (!loan) {
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Not Found', message: `Loan #${paramId} not found` }),
        };
      }

      const payments = await loanRepository.getLoanPayments(paramId);
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(payments),
      };
    }

    // ----------------------------------------------------
    // GET /api/loans/:id/outstanding
    // ----------------------------------------------------
    if (method === 'GET' && paramId !== null && isOutstanding) {
      const loan = await loanRepository.findById(paramId);
      if (!loan) {
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Not Found', message: `Loan #${paramId} not found` }),
        };
      }

      const outstanding = await loanRepository.calculateOutstanding(paramId);
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(outstanding),
      };
    }

    // ----------------------------------------------------
    // GET /api/loans/:id (Single Loan with Details & Outstanding)
    // ----------------------------------------------------
    if (method === 'GET' && paramId !== null) {
      const loan = await loanRepository.findById(paramId);
      if (!loan) {
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Not Found', message: `Loan #${paramId} not found` }),
        };
      }

      const borrower = await borrowerRepository.findById(loan.borrowerId);
      const outstanding = await loanRepository.calculateOutstanding(paramId);
      const rawPayments = await loanRepository.getLoanPayments(paramId);

      const payments = rawPayments.map((p) => ({
        id: p.id,
        receiptNumber: p.receipt_number,
        paymentDate: String(p.payment_date || '').split('T')[0],
        paymentAmount: Number(p.payment_amount || 0),
        principalPortion: Number(p.principal_portion || 0),
        interestPortion: Number(p.interest_portion || 0),
        paymentMode: p.payment_mode,
        isVoid: Boolean(p.is_void),
        notes: p.notes,
        createdAt: p.created_at instanceof Date ? p.created_at.toISOString() : String(p.created_at),
      }));

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          ...loan,
          borrower: borrower || undefined,
          outstanding,
          payments,
        }),
      };
    }

    // ----------------------------------------------------
    // GET /api/loans (Paginated List with Filters)
    // ----------------------------------------------------
    if (method === 'GET') {
      const filters = {
        borrowerId: query.borrowerId ? Number(query.borrowerId) : undefined,
        status: query.status,
        startDate: query.startDate || query.from_date,
        endDate: query.endDate || query.to_date,
        minRate: query.minRate ? Number(query.minRate) : undefined,
        maxRate: query.maxRate ? Number(query.maxRate) : undefined,
        search: query.search || query.q,
        page: query.page ? Number(query.page) : 1,
        limit: query.limit ? Number(query.limit) : 10,
      };

      const result = await loanRepository.findAll(filters);
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(result),
      };
    }

    // ----------------------------------------------------
    // POST /api/loans/:id/status (Manual status update)
    // ----------------------------------------------------
    if (method === 'POST' && paramId !== null && isStatusUpdate) {
      if (user.role !== 'admin') {
        return {
          statusCode: 403,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Forbidden', message: 'Only administrators can update loan status' }),
        };
      }

      if (!event.body) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Bad Request', message: 'Request body is required' }),
        };
      }

      const body = JSON.parse(event.body);
      const status = body.status;
      if (!['active', 'overdue', 'completed', 'cancelled'].includes(status)) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Bad Request', message: 'Invalid status value' }),
        };
      }

      const updated = await loanRepository.updateStatus(paramId, status, user.id);
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(updated),
      };
    }

    // ----------------------------------------------------
    // POST /api/loans (Create Loan)
    // ----------------------------------------------------
    if (method === 'POST') {
      if (user.role !== 'admin' && user.role !== 'operator') {
        return {
          statusCode: 403,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Forbidden', message: 'Only admin and operator can create loans' }),
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
      const validation = loanSchema.safeParse(parsed);
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

      const created = await loanRepository.create(validation.data, user.id);
      return {
        statusCode: 201,
        headers: corsHeaders,
        body: JSON.stringify(created),
      };
    }

    // ----------------------------------------------------
    // PUT /api/loans/:id (Update Loan)
    // ----------------------------------------------------
    if (method === 'PUT') {
      if (user.role !== 'admin' && user.role !== 'operator') {
        return {
          statusCode: 403,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Forbidden', message: 'Only admin and operator can update loans' }),
        };
      }

      if (paramId === null) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Bad Request', message: 'Valid loan ID is required in URL' }),
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
      const validation = loanUpdateSchema.safeParse(parsed);
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

      const updated = await loanRepository.update(paramId, validation.data, user.id);
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(updated),
      };
    }

    // ----------------------------------------------------
    // DELETE /api/loans/:id (Soft Delete Loan)
    // ----------------------------------------------------
    if (method === 'DELETE') {
      if (user.role !== 'admin') {
        return {
          statusCode: 403,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Forbidden', message: 'Only administrators can delete loans' }),
        };
      }

      if (paramId === null) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Bad Request', message: 'Valid loan ID is required in URL' }),
        };
      }

      await loanRepository.softDelete(paramId, user.id);
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ success: true, message: `Loan #${paramId} deleted successfully` }),
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
      message.includes('not found') ||
      message.includes('Cannot delete loan') ||
      message.includes('blacklisted') ||
      message.includes('greater than') ||
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
