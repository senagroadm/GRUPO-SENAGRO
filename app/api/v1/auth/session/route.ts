import { NextRequest, NextResponse } from 'next/server';
import { createSecureHandler } from '@/backend/core/security/middleware';
import { tenantContextService } from '@/backend/modules/multi-tenant/tenant-context-service';

export const GET = createSecureHandler(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId') || req.headers.get('x-user-id') || 'u1111111-1111-1111-1111-111111111111';

  const session = tenantContextService.getSessionInfo(userId);

  return NextResponse.json({
    success: true,
    data: session,
  });
});
