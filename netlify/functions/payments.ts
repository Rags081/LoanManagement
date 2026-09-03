import { HandlerResponse } from '@netlify/functions';
import { requireAuth, AuthenticatedEvent, corsHeaders } from './_lib/auth-middleware';
import { paymentRepository, loanRepository } from './_lib/repositories';
import { paymentSchema, paymentFilterSchema, paymentVoidSchema } from '../../src/utils/validation';

export const handler = requireAuth(async (event: AuthenticatedEvent): Promise<HandlerResponse> => {
  const method = event.httpMethod;
  const user = event.user;
  const rawPath = event.path || '';
  const query = event.queryStringParameters || {};

  // Extract path segments (e.g. /api/payments, /api/payments/1, /api/payments/summary, /api/payments/modes, /api/payments/loan/1, /api/payments/loan/1/total, /api/payments/1/void)
  const segments = rawPath.split('/').filter(Boolean);
  const lastSegment = segments[segments.length - 1] || '';
  const secondLastSegment = segments.length >= 2 ? segments[segments.length - 2] : '';
  const thirdLastSegment = segments.length >= 3 ? segments[segments.length - 3] : '';

  const isSummary = lastSegment === 'summary' || query.action === 'summary';
  const isModes = lastSegment === 'modes' || query.action === 'modes';
  const isVoidAction = lastSegment === 'void' || query.action === 'void';

  const isLoanPayments = secondLastSegment === 'loan' && !isNaN(Number(lastSegment));
  const isLoanTotal = thirdLastSegment === 'loan' && !isNaN(Number(secondLastSegment)) && lastSegment === 'total';

  let paramId: number | null = null;
  if (!isNaN(Number(lastSegment))) {
    paramId = Number(lastSegment);
  } else if (isVoidAction && !isNaN(Number(secondLastSegment))) {
    paramId = Number(secondLastSegment);
  } else if (!isNaN(Number(query.id))) {
    paramId = Number(query.id);
  }

  let loanParamId: number | null = null;
  if (isLoanPayments) {
    loanParamId = Number(lastSegment);
  } else if (isLoanTotal) {
    loanParamId = Number(secondLastSegment);
  } else if (!isNaN(Number(query.loanId || query.loan_id))) {
    loanParamId = Number(query.loanId || query.loan_id);
  }

  try {
    // ----------------------------------------------------
    // GET /api/payments/modes
    // ----------------------------------------------------
    if (method === 'GET' && isModes) {
      const modes = [
        { value: 'cash', label: 'Cash Payment' },
        { value: 'upi', label: 'UPI / QR Transfer (GPay, PhonePe, Paytm)' },
        { value: 'bank_transfer', label: 'Direct Bank Account Transfer (NEFT/IMPS/RTGS)' },
        { value: 'other', label: 'Other Method / Cheque' },
      ];
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(modes),
      };
    }

    // ----------------------------------------------------
    // GET /api/payments/summary
    // ----------------------------------------------------
    if (method === 'GET' && isSummary) {
      const filters = {
        loan_id: query.loanId ? Number(query.loanId) : query.loan_id ? Number(query.loan_id) : undefined,
        borrower_id: query.borrowerId ? Number(query.borrowerId) : query.borrower_id ? Number(query.borrower_id) : undefined,
        payment_mode: query.paymentMode || query.payment_mode,
        from_date: query.startDate || query.from_date,
        to_date: query.endDate || query.to_date,
      };
      const summary = await paymentRepository.getPaymentSummary(filters);
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(summary),
      };
    }

    // ----------------------------------------------------
    // GET /api/payments/loan/:loanId/total
    // ----------------------------------------------------
    if (method === 'GET' && isLoanTotal && loanParamId !== null) {
      const total = await paymentRepository.getTotalReceivedByLoan(loanParamId);
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(total),
      };
    }

    // ----------------------------------------------------
    // GET /api/payments/loan/:loanId
    // ----------------------------------------------------
    if (method === 'GET' && isLoanPayments && loanParamId !== null) {
      const payments = await paymentRepository.findByLoan(loanParamId);
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(payments),
      };
    }

    // ----------------------------------------------------
    // GET /api/payments/:id
    // ----------------------------------------------------
    if (method === 'GET' && paramId !== null && !isSummary && !isModes && !isLoanPayments && !isLoanTotal) {
      const payment = await paymentRepository.findById(paramId);
      if (!payment) {
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Not Found', message: `Payment #${paramId} not found` }),
        };
      }

      const allocations = await paymentRepository.getAllocations(paramId);
      const loan = await loanRepository.findById(payment.loan_id);

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          id: payment.id,
          paymentId: payment.payment_id,
          loanId: payment.loan_id,
          loanCustomId: payment.loan_custom_id,
          borrowerName: payment.borrower_name,
          borrowerPhone: payment.borrower_phone,
          borrowerIdCode: payment.borrower_id_code,
          paymentDate: String(payment.payment_date).split('T')[0],
          paymentAmount: Number(payment.payment_amount),
          principalPortion: Number(payment.principal_portion),
          interestPortion: Number(payment.interest_portion),
          paymentMode: payment.payment_mode,
          referenceNumber: payment.reference_number,
          notes: payment.notes,
          isVoid: Boolean(payment.is_void),
          voidReason: payment.void_reason,
          voidedAt: payment.voided_at instanceof Date ? payment.voided_at.toISOString() : payment.voided_at,
          voidedBy: payment.voided_by,
          voidedByName: payment.voided_by_name,
          createdBy: payment.created_by,
          creatorName: payment.creator_name,
          createdAt: payment.created_at instanceof Date ? payment.created_at.toISOString() : String(payment.created_at),
          updatedAt: payment.updated_at instanceof Date ? payment.updated_at.toISOString() : String(payment.updated_at),
          allocations: allocations.map((a) => ({
            id: a.id,
            paymentId: a.payment_id,
            allocatedTo: a.allocated_to,
            amount: Number(a.amount),
            runningPrincipalBalance: Number(a.running_principal_balance),
            runningInterestBalance: Number(a.running_interest_balance),
            createdAt: a.created_at instanceof Date ? a.created_at.toISOString() : String(a.created_at),
          })),
          loan: loan || undefined,
        }),
      };
    }

    // ----------------------------------------------------
    // GET /api/payments (Paginated List with Filters)
    // ----------------------------------------------------
    if (method === 'GET') {
      const validation = paymentFilterSchema.safeParse(query);
      const filters = {
        loan_id: query.loanId ? Number(query.loanId) : query.loan_id ? Number(query.loan_id) : undefined,
        borrower_id: query.borrowerId ? Number(query.borrowerId) : query.borrower_id ? Number(query.borrower_id) : undefined,
        payment_mode: query.paymentMode || query.payment_mode,
        is_void: query.isVoid !== undefined ? query.isVoid === 'true' || query.isVoid === '1' : undefined,
        from_date: query.startDate || query.from_date,
        to_date: query.endDate || query.to_date,
        search: query.search || query.q,
      };

      const pagination = {
        page: validation.success ? validation.data.page : Number(query.page || 1),
        limit: validation.success ? validation.data.limit : Number(query.limit || 10),
      };

      const result = await paymentRepository.findAll(filters, pagination);

      const mapped = result.data.map((p) => ({
        id: p.id,
        paymentId: p.payment_id,
        loanId: p.loan_id,
        loanCustomId: p.loan_custom_id,
        borrowerName: p.borrower_name,
        borrowerPhone: p.borrower_phone,
        borrowerIdCode: p.borrower_id_code,
        paymentDate: String(p.payment_date).split('T')[0],
        paymentAmount: Number(p.payment_amount),
        principalPortion: Number(p.principal_portion),
        interestPortion: Number(p.interest_portion),
        paymentMode: p.payment_mode,
        referenceNumber: p.reference_number,
        notes: p.notes,
        isVoid: Boolean(p.is_void),
        voidReason: p.void_reason,
        voidedAt: p.voided_at instanceof Date ? p.voided_at.toISOString() : p.voided_at,
        voidedBy: p.voided_by,
        voidedByName: p.voided_by_name,
        createdBy: p.created_by,
        creatorName: p.creator_name,
        createdAt: p.created_at instanceof Date ? p.created_at.toISOString() : String(p.created_at),
        updatedAt: p.updated_at instanceof Date ? p.updated_at.toISOString() : String(p.updated_at),
      }));

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          data: mapped,
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        }),
      };
    }

    // ----------------------------------------------------
    // POST /api/payments/:id/void (Void payment - Admin only)
    // ----------------------------------------------------
    if (method === 'POST' && paramId !== null && isVoidAction) {
      if (user.role !== 'admin') {
        return {
          statusCode: 403,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Forbidden', message: 'Only administrators can void payments' }),
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
      const validation = paymentVoidSchema.safeParse(body);
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

      const voided = await paymentRepository.void(paramId, validation.data.voidReason, user.id);
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(voided),
      };
    }

    // ----------------------------------------------------
    // POST /api/payments (Record Payment - Admin & Operator)
    // ----------------------------------------------------
    if (method === 'POST') {
      if (user.role !== 'admin' && user.role !== 'operator') {
        return {
          statusCode: 403,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Forbidden', message: 'Only admin and operator can record payments' }),
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
      const validation = paymentSchema.safeParse(parsed);
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

      const created = await paymentRepository.create(
        {
          loan_id: validation.data.loanId,
          payment_date: validation.data.paymentDate,
          payment_amount: validation.data.paymentAmount,
          payment_mode: validation.data.paymentMode,
          reference_number: validation.data.referenceNumber,
          notes: validation.data.notes,
          allocation_method: validation.data.allocationMethod,
          principal_portion: validation.data.principalPortion,
          interest_portion: validation.data.interestPortion,
        },
        user.id
      );

      return {
        statusCode: 201,
        headers: corsHeaders,
        body: JSON.stringify(created),
      };
    }

    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Payment API Error:', err);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Internal Server Error',
        message: err.message || 'An unexpected error occurred in Payment Module',
      }),
    };
  }
});
