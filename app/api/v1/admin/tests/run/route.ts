import { NextRequest, NextResponse } from 'next/server';
import { createSecureHandler } from '@/backend/core/security/middleware';
import { runMultiTenantTestSuite } from '@/backend/tests/multi_tenant_isolation.test';
import { logger } from '@/backend/core/logger';

export const POST = createSecureHandler(async (req: NextRequest, ctx) => {
  const userId = req.headers.get('x-user-id') || 'sys-admin';
  logger.info('Executing Multi-Tenant Security & Isolation Test Suite', {
    requestId: ctx.requestId,
    initiatedBy: userId,
  });

  const testReport = runMultiTenantTestSuite();

  return NextResponse.json({
    success: testReport.summary.failed === 0,
    timestamp: new Date().toISOString(),
    ...testReport,
  });
});
