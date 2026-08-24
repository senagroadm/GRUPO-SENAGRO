import { ZodError } from 'zod';

export interface StandardErrorBody {
  success: false;
  error: {
    code: string;
    message: string;
    statusCode: number;
    details?: unknown;
    stack?: string;
  };
  requestId: string;
  timestamp: string;
}

export abstract class AppError extends Error {
  public abstract readonly statusCode: number;
  public abstract readonly code: string;
  public readonly details?: unknown;

  constructor(message: string, details?: unknown) {
    super(message);
    this.name = this.constructor.name;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  public toResponse(requestId: string = 'req-unknown'): StandardErrorBody {
    const currentEnv = String(process.env.NODE_ENV || 'development');
    const isProdOrStaging = currentEnv === 'production' || currentEnv === 'staging';

    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        statusCode: this.statusCode,
        details: this.details,
        // Nunca vazar stack trace em ambientes de staging ou produção
        stack: isProdOrStaging ? undefined : this.stack,
      },
      requestId,
      timestamp: new Date().toISOString(),
    };
  }
}

export class BadRequestError extends AppError {
  public readonly statusCode = 400;
  public readonly code = 'BAD_REQUEST';
}

export class ValidationError extends AppError {
  public readonly statusCode = 422;
  public readonly code = 'VALIDATION_FAILED';

  constructor(message: string = 'Dados de entrada inválidos', details?: unknown) {
    super(message, details);
  }

  public static fromZodError(zodError: ZodError): ValidationError {
    const formatted = zodError.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
      rule: issue.code,
    }));
    return new ValidationError('Falha na validação do schema de entrada', formatted);
  }
}

export class UnauthorizedError extends AppError {
  public readonly statusCode = 401;
  public readonly code = 'UNAUTHORIZED';
}

export class ForbiddenError extends AppError {
  public readonly statusCode = 403;
  public readonly code = 'FORBIDDEN';
}

export class TenantMismatchError extends AppError {
  public readonly statusCode = 403;
  public readonly code = 'TENANT_MISMATCH';

  constructor(message: string = 'Usuário não tem autorização para acessar esta empresa do grupo') {
    super(message);
  }
}

export class NotFoundError extends AppError {
  public readonly statusCode = 404;
  public readonly code = 'NOT_FOUND';
}

export class ConflictError extends AppError {
  public readonly statusCode = 409;
  public readonly code = 'CONFLICT';
}

export class InternalServerError extends AppError {
  public readonly statusCode = 500;
  public readonly code = 'INTERNAL_SERVER_ERROR';

  constructor(message: string = 'Erro interno do servidor', details?: unknown) {
    super(message, details);
  }
}

export function formatErrorResponse(error: unknown, requestId: string = 'req-unknown'): StandardErrorBody {
  const currentEnv = String(process.env.NODE_ENV || 'development');
  const isProdOrStaging = currentEnv === 'production' || currentEnv === 'staging';

  if (error instanceof AppError) {
    return error.toResponse(requestId);
  }

  if (error instanceof ZodError) {
    return ValidationError.fromZodError(error).toResponse(requestId);
  }

  const rawMessage = error instanceof Error ? error.message : 'Erro interno não identificado';
  const safeMessage = isProdOrStaging
    ? 'Ocorreu um erro interno ao processar a solicitação. Contate o suporte com o identificador da requisição.'
    : rawMessage;

  return {
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: safeMessage,
      statusCode: 500,
      stack: isProdOrStaging ? undefined : (error instanceof Error ? error.stack : undefined),
    },
    requestId,
    timestamp: new Date().toISOString(),
  };
}
