import { NextRequest, NextResponse } from 'next/server';
import { createSecureHandler } from '@/backend/core/security/middleware';
import { crmService } from '@/backend/modules/crm/crm-service';

export const GET = createSecureHandler(async (req: NextRequest, ctx) => {
  const { searchParams } = new URL(req.url);
  const empresaId = req.headers.get('x-empresa-id') || searchParams.get('empresaId') || 'e1111111-1111-1111-1111-111111111111';

  const metrics = crmService.obterMetricasDashboard(empresaId);

  return NextResponse.json({
    success: true,
    data: metrics,
    empresaId,
    timestamp: new Date().toISOString(),
    requestId: ctx.requestId,
  });
});
