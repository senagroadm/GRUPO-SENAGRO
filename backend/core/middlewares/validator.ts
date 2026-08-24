import { z, ZodSchema } from 'zod';
import { ValidationError } from '../errors';

export function validateSchema<T>(schema: ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw ValidationError.fromZodError(result.error);
  }
  return result.data;
}

export function validateAsyncSchema<T>(schema: ZodSchema<T>, data: unknown): Promise<T> {
  return schema.parseAsync(data).catch((err) => {
    if (err instanceof z.ZodError) {
      throw ValidationError.fromZodError(err);
    }
    throw err;
  });
}
