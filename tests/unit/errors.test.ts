import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
  TenantMismatchError,
  formatErrorResponse,
} from '../../backend/core/errors';

describe('Error Handling Standard Unit Tests', () => {
  it('should format AppError subclasses into standard RFC error responses', () => {
    const error = new NotFoundError('Item de estoque não encontrado');
    const response = error.toResponse('req-test-123');

    expect(response.success).toBe(false);
    expect(response.error.code).toBe('NOT_FOUND');
    expect(response.error.statusCode).toBe(404);
    expect(response.error.message).toBe('Item de estoque não encontrado');
    expect(response.requestId).toBe('req-test-123');
    expect(response.timestamp).toBeDefined();
  });

  it('should format Zod schema errors into ValidationError with field details', () => {
    const sampleSchema = z.object({
      cnpj: z.string().length(14, 'CNPJ deve ter 14 dígitos numéricos'),
      valor: z.number().positive('Valor deve ser maior que zero'),
    });

    const parsed = sampleSchema.safeParse({ cnpj: '123', valor: -10 });
    expect(parsed.success).toBe(false);

    if (!parsed.success) {
      const valError = ValidationError.fromZodError(parsed.error);
      const res = valError.toResponse('req-zod-001');

      expect(res.error.statusCode).toBe(422);
      expect(res.error.code).toBe('VALIDATION_FAILED');
      expect(Array.isArray(res.error.details)).toBe(true);
      expect((res.error.details as Array<{ field: string }>).length).toBe(2);
    }
  });

  it('should handle TenantMismatchError with HTTP 403 and distinct code', () => {
    const error = new TenantMismatchError();
    const res = formatErrorResponse(error, 'req-tenant-403');

    expect(res.error.statusCode).toBe(403);
    expect(res.error.code).toBe('TENANT_MISMATCH');
  });

  it('should handle unhandled native errors with 500 without leaking stack traces in response body', () => {
    const nativeErr = new Error('Raw unhandled crash');
    const res = formatErrorResponse(nativeErr, 'req-crash-500');

    expect(res.error.statusCode).toBe(500);
    expect(res.error.code).toBe('INTERNAL_SERVER_ERROR');
    expect(res.requestId).toBe('req-crash-500');
  });
});
