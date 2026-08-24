import { NextRequest, NextResponse } from 'next/server';
import { createSecureHandler } from '@/backend/core/security/middleware';
import { tenantContextService } from '@/backend/modules/multi-tenant/tenant-context-service';

export const GET = createSecureHandler(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const limitParam = searchParams.get('limit');
  const limit = limitParam ? parseInt(limitParam, 10) : 50;

  const logs = tenantContextService.getAuditLogs(limit);

  return NextResponse.json({
    success: true,
    total: logs.length,
    data: logs,
  });
});
