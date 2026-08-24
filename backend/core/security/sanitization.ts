import { AppError } from '../errors';

export class TimeoutError extends AppError {
  public readonly statusCode = 504;
  public readonly code = 'GATEWAY_TIMEOUT';

  constructor(message = 'Tempo limite de execução da requisição excedido') {
    super(message);
  }
}

export class PayloadTooLargeError extends AppError {
  public readonly statusCode = 413;
  public readonly code = 'PAYLOAD_TOO_LARGE';

  constructor(message = 'Tamanho do payload da requisição excede o limite máximo permitido') {
    super(message);
  }
}

export class RateLimitExceededError extends AppError {
  public readonly statusCode = 429;
  public readonly code = 'TOO_MANY_REQUESTS';

  constructor(message = 'Limite de requisições excedido. Tente novamente mais tarde.', details?: unknown) {
    super(message, details);
  }
}

/**
 * Sanitiza strings para proteção contra Cross-Site Scripting (XSS) e injeções
 */
export function sanitizeString(val: string): string {
  if (typeof val !== 'string') return val;
  return val
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove <script> tags
    .replace(/javascript:/gi, '') // Remove pseudo-protocol
    .replace(/on\w+\s*=/gi, '') // Remove inline event handlers like onclick=
    .trim();
}

/**
 * Sanitiza recursivamente objetos e arrays JSON
 */
export function sanitizePayload<T>(input: T, depth = 0): T {
  if (depth > 10 || input === null || input === undefined) {
    return input;
  }

  if (typeof input === 'string') {
    return sanitizeString(input) as unknown as T;
  }

  if (Array.isArray(input)) {
    return input.map((item) => sanitizePayload(item, depth + 1)) as unknown as T;
  }

  if (typeof input === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
      sanitized[key] = sanitizePayload(value, depth + 1);
    }
    return sanitized as T;
  }

  return input;
}

/**
 * Executa uma Promise com limite de timeout
 */
export async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, customMessage?: string): Promise<T> {
  let timer: NodeJS.Timeout;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new TimeoutError(customMessage || `Operação abortada após ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timer!);
  }
}

/**
 * Valida o tamanho do body ou arquivo com base no Content-Length
 */
export function validateUploadSize(
  contentLengthHeader: string | null | undefined,
  maxAllowedBytes: number
): void {
  if (!contentLengthHeader) {
    return;
  }

  const length = parseInt(contentLengthHeader, 10);
  if (!isNaN(length) && length > maxAllowedBytes) {
    const maxMb = (maxAllowedBytes / (1024 * 1024)).toFixed(1);
    const actualMb = (length / (1024 * 1024)).toFixed(1);
    throw new PayloadTooLargeError(
      `O tamanho do arquivo (${actualMb} MB) excede o limite máximo permitido (${maxMb} MB)`
    );
  }
}
