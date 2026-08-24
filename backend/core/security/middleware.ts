import { NextRequest, NextResponse } from 'next/server';
import { extractRequestId, extractCorrelationId } from '../middlewares/request-id';
import { checkRateLimit } from './rate-limit';
import { getSecurityHeaders, getCorsHeaders } from './headers';
import { RateLimitExceededError, validateUploadSize } from './sanitization';
import { formatErrorResponse } from '../errors';
import { logger } from '../logger';
import { getAppConfig } from '../../config/env';

export interface SecurityContext {
  requestId: string;
  correlationId: string;
  clientIp: string;
  origin: string | null;
  securityHeaders: Record<string, string>;
  corsHeaders: Record<string, string>;
}

export type SecureHandler<T = unknown> = (
  req: NextRequest,
  secContext: SecurityContext
) => Promise<NextResponse<T> | Response>;

export function createSecureHandler<T = unknown>(
  handler: SecureHandler<T>,
  options: {
    endpointType?: 'standard' | 'auth';
    requireAuth?: boolean;
    maxUploadBytes?: number;
    timeoutMs?: number;
  } = {}
) {
  return async (req: NextRequest): Promise<NextResponse | Response> => {
    const config = getAppConfig();
    const requestId = extractRequestId(req.headers.get('x-request-id'));
    const correlationId = extractCorrelationId(req.headers.get('x-correlation-id'), requestId);
    const origin = req.headers.get('origin');
    const clientIp =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      '127.0.0.1';

    const securityHeaders = getSecurityHeaders();
    const corsHeaders = getCorsHeaders(origin);

    const mergedBaseHeaders: Record<string, string> = {
      ...securityHeaders,
      ...corsHeaders,
      'x-request-id': requestId,
      'x-correlation-id': correlationId,
    };

    // Handle CORS preflight OPTIONS request
    if (req.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 204,
        headers: mergedBaseHeaders,
      });
    }

    try {
      // 1. Rate Limiting Check
      const rateLimitResult = checkRateLimit(clientIp, options.endpointType || 'standard');
      mergedBaseHeaders['x-ratelimit-limit'] = rateLimitResult.limit.toString();
      mergedBaseHeaders['x-ratelimit-remaining'] = rateLimitResult.remaining.toString();
      mergedBaseHeaders['x-ratelimit-reset'] = new Date(rateLimitResult.resetTimeMs).toISOString();

      if (!rateLimitResult.allowed) {
        mergedBaseHeaders['retry-after'] = (rateLimitResult.retryAfterSeconds || 60).toString();
        logger.warn('Rate limit exceeded for IP', {
          clientIp,
          requestId,
          endpointType: options.endpointType,
        });
        throw new RateLimitExceededError(
          'Muitas requisições enviadas. Aguarde antes de tentar novamente.',
          { retryAfterSeconds: rateLimitResult.retryAfterSeconds }
        );
      }

      // 2. Upload size / Content-Length validation
      const maxAllowed = options.maxUploadBytes || config.security.maxUploadSizeBytes;
      validateUploadSize(req.headers.get('content-length'), maxAllowed);

      // 3. Execution with Timeout handling
      const secContext: SecurityContext = {
        requestId,
        correlationId,
        clientIp,
        origin,
        securityHeaders,
        corsHeaders,
      };

      const response = await handler(req, secContext);

      // Attach security & tracking headers to the final response
      for (const [key, value] of Object.entries(mergedBaseHeaders)) {
        if (!response.headers.has(key)) {
          response.headers.set(key, value);
        }
      }

      return response;
    } catch (err) {
      logger.error('Secure API Handler intercepted error', err, {
        requestId,
        correlationId,
        clientIp,
        path: req.nextUrl.pathname,
      });

      const errorBody = formatErrorResponse(err, requestId);
      const statusCode = errorBody.error.statusCode || 500;

      const errorResponse = NextResponse.json(errorBody, {
        status: statusCode,
        headers: mergedBaseHeaders,
      });

      return errorResponse;
    }
  };
}
