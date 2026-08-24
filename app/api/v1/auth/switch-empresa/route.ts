import { NextRequest, NextResponse } from 'next/server';
import { createSecureHandler } from '@/backend/core/security/middleware';
import { tenantContextService } from '@/backend/modules/multi-tenant/tenant-context-service';
import { logger } from '@/backend/core/logger';

export const POST = createSecureHandler(async (req: NextRequest, ctx) => {
  const body = await req.json();
  const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
  const userAgent = req.headers.get('user-agent') || 'Browser-Client';
  const resolvedUserId = body.userId || req.headers.get('x-user-id') || 'u1111111-1111-1111-1111-111111111111';

  const switchResult = tenantContextService.switchActiveCompany({
    userId: resolvedUserId,
    targetEmpresaId: body.targetEmpresaId,
    motivo: body.motivo,
    correlationId: ctx.correlationId,
    ipAddress: clientIp,
    userAgent,
  });

  logger.info('Switched tenant active context', {
    requestId: ctx.requestId,
    userId: resolvedUserId,
    targetEmpresaId: body.targetEmpresaId,
    empresaNome: switchResult.activeCompany.nomeFantasia,
    auditLogId: switchResult.auditLogId,
  });

  return NextResponse.json({
    success: true,
    message: `Contexto operacional alternado com sucesso para ${switchResult.activeCompany.nomeFantasia}.`,
    data: switchResult,
  });
});
