import { NextRequest, NextResponse } from 'next/server';
import { checkDatabaseHealth } from '@/backend/db/client';
import { getAppConfig } from '@/backend/config/env';
import { createSecureHandler } from '@/backend/core/security/middleware';
import { logger } from '@/backend/core/logger';

export const GET = createSecureHandler(async (_req: NextRequest, secContext) => {
  const config = getAppConfig();
  const dbHealth = await checkDatabaseHealth();
  const isHealthy = dbHealth.status === 'healthy';

  const memory = process.memoryUsage();
  const payload = {
    success: true,
    status: isHealthy ? 'pass' : 'degraded',
    version: '1.0.0',
    apiVersion: 'v1',
    environment: config.NODE_ENV,
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    system: {
      nodeVersion: process.version,
      memoryUsageMb: {
        rss: Math.round(memory.rss / (1024 * 1024)),
        heapTotal: Math.round(memory.heapTotal / (1024 * 1024)),
        heapUsed: Math.round(memory.heapUsed / (1024 * 1024)),
      },
    },
    checks: {
      database: {
        status: dbHealth.status,
        latencyMs: dbHealth.latencyMs,
        ...(dbHealth.error ? { message: dbHealth.error } : {}),
      },
    },
    security: {
      rateLimitingEnabled: config.security.rateLimit.enabled,
      mfaEnforced: config.security.mfa.enforceForCriticalRoles,
      corsRestricted: config.security.cors.allowedOrigins.length > 0,
      uploadLimitMb: config.security.maxUploadSizeBytes / (1024 * 1024),
    },
    requestId: secContext.requestId,
  };

  logger.info('Health check evaluated with security headers', {
    requestId: secContext.requestId,
    status: payload.status,
    dbStatus: dbHealth.status,
  });

  return NextResponse.json(payload, {
    status: 200,
  });
});
