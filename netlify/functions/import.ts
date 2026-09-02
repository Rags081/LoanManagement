import { HandlerResponse } from '@netlify/functions';
import { requireAuth, AuthenticatedEvent, corsHeaders } from './_lib/auth-middleware';
import { excelImportService } from './_lib/services/excel-import.service';
import { templateGeneratorService } from './_lib/services/template-generator.service';
import { ImportType } from '../../../src/types/report';

export const handler = requireAuth(async (event: AuthenticatedEvent): Promise<HandlerResponse> => {
  const method = event.httpMethod;
  const rawPath = event.path || '';
  const query = event.queryStringParameters || {};
  const user = event.user;

  // 1. GET /api/import/template?type=borrowers
  if (method === 'GET') {
    const type = (query.type || 'borrowers') as ImportType;
    if (!['borrowers', 'loans', 'payments', 'capital'].includes(type)) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: `Invalid import template type: ${type}` }),
      };
    }

    try {
      const buffer = await templateGeneratorService.generateTemplateWorkbook(type);
      const filename = templateGeneratorService.getTemplateInfo(type).filename;

      return {
        statusCode: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
        body: buffer.toString('base64'),
        isBase64Encoded: true,
      };
    } catch (err: unknown) {
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Failed to generate template', message: (err as Error).message }),
      };
    }
  }

  // 2. POST /api/import/:importType (Admin & Operator only)
  if (method === 'POST') {
    if (user.role === 'viewer') {
      return {
        statusCode: 403,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Forbidden', message: 'You do not have permission to import data' }),
      };
    }

    const segments = rawPath.split('/').filter(Boolean);
    const type = (segments[segments.length - 1] || 'borrowers') as ImportType;

    if (!['borrowers', 'loans', 'payments', 'capital'].includes(type)) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: `Invalid import type: ${type}` }),
      };
    }

    let fileBuffer: Buffer | null = null;

    try {
      if (event.isBase64Encoded && event.body) {
        fileBuffer = Buffer.from(event.body, 'base64');
      } else if (event.body) {
        // Check if JSON with base64 payload
        try {
          const bodyJson = JSON.parse(event.body);
          if (bodyJson.fileBase64) {
            const cleanBase64 = bodyJson.fileBase64.replace(/^data:.*?;base64,/, '');
            fileBuffer = Buffer.from(cleanBase64, 'base64');
          }
        } catch {
          fileBuffer = Buffer.from(event.body, 'utf-8');
        }
      }

      if (!fileBuffer) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Missing Excel file body or fileBase64 parameter' }),
        };
      }

      const result = await excelImportService.importData(type, fileBuffer, user.id);

      return {
        statusCode: result.success ? 200 : 422,
        headers: corsHeaders,
        body: JSON.stringify(result),
      };
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Import Error:', err);
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Internal Server Error',
          message: err.message || 'Import processing failed',
        }),
      };
    }
  }

  return {
    statusCode: 405,
    headers: corsHeaders,
    body: JSON.stringify({ error: 'Method Not Allowed' }),
  };
});
