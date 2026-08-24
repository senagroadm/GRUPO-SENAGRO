import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { validateSchema } from '../../backend/core/middlewares/validator';
import { ValidationError } from '../../backend/core/errors';

describe('Validation Middleware Helper Unit Tests', () => {
  const companyInputSchema = z.object({
    codigo: z.string().min(2).max(10),
    cnpj: z.string().regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, 'CNPJ format invalid'),
    regimeTributario: z.enum(['LUCRO_REAL', 'LUCRO_PRESUMIDO', 'SIMPLES_NACIONAL']),
  });

  it('should validate valid data without error', () => {
    const validData = {
      codigo: 'MWAM',
      cnpj: '44.566.045/0001-01',
      regimeTributario: 'LUCRO_PRESUMIDO',
    };

    const result = validateSchema(companyInputSchema, validData);
    expect(result).toEqual(validData);
  });

  it('should throw ValidationError on invalid data', () => {
    const invalidData = {
      codigo: 'X',
      cnpj: '12345',
      regimeTributario: 'INVALID_REGIME',
    };

    expect(() => validateSchema(companyInputSchema, invalidData)).toThrow(ValidationError);
  });
});
