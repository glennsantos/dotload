import { NextResponse } from 'next/server';

export { NextResponse };

type ErrorResponse = {
  error: string;
  details?: string;
  code?: string;
};

type SuccessResponse<T = any> = {
  success: boolean;
  data?: T;
  message?: string;
};

export const createErrorResponse = (
  error: string,
  status: number,
  options: { details?: string; code?: string } = {}
) => {
  const response: ErrorResponse = { error, ...options };
  return NextResponse.json(response, { status });
};

export const createSuccessResponse = <T = any>(
  data?: T,
  options: { message?: string; status?: number } = {}
) => {
  const response: SuccessResponse<T> = { success: true, ...(data && { data }) };
  if (options.message) response.message = options.message;
  return NextResponse.json(response, { status: options.status || 200 });
};

// Common error responses
export const ERROR_RESPONSES = {
  invalidRequest: (details?: string) =>
    createErrorResponse('Invalid request', 400, { code: 'INVALID_REQUEST', details }),
  unauthorized: (details?: string) =>
    createErrorResponse('Unauthorized', 401, { code: 'UNAUTHORIZED', details }),
  forbidden: (details?: string) =>
    createErrorResponse('Forbidden', 403, { code: 'FORBIDDEN', details }),
  notFound: (details?: string) =>
    createErrorResponse('Not found', 404, { code: 'NOT_FOUND', details }),
  conflict: (details?: string) =>
    createErrorResponse('Conflict', 409, { code: 'CONFLICT', details }),
  serverError: (details?: string) =>
    createErrorResponse('Internal server error', 500, { code: 'SERVER_ERROR', details }),
  databaseError: (details?: string) =>
    createErrorResponse('Database error', 500, { code: 'DATABASE_ERROR', details }),
  validationError: (details?: string) =>
    createErrorResponse('Validation error', 400, { code: 'VALIDATION_ERROR', details }),
} as const;
