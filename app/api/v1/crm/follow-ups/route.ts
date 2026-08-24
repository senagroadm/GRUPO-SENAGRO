import { NextRequest, NextResponse } from 'next/server';
import { createSecureHandler } from '@/backend/core/security/middleware';
import { crmService } from '@/backend/modules/crm/crm-service';

export const GET = createSecureHandler(async (req: NextRequest, ctx) => {
  const { searchParams } = new URL(req.url);
  const empresaId = req.headers.get('x-empresa-id') || searchParams.get('empresaId') || 'e1111111-1111-1111-1111-111111111111';
  const status = searchParams.get('status') || undefined;
  const usuarioId = searchParams.get('usuarioId') || undefined;
  const apenasAtrasados = searchParams.get('atrasados') === 'true';

  const followUps = crmService.listarFollowUps(empresaId, { status, usuarioId, apenasAtrasados });

  return NextResponse.json({
    success: true,
    total: followUps.length,
    data: followUps,
    requestId: ctx.requestId,
  });
});

export const POST = createSecureHandler(async (req: NextRequest, ctx) => {
  const empresaId = req.headers.get('x-empresa-id') || 'e1111111-1111-1111-1111-111111111111';
  const usuarioId = req.headers.get('x-user-id') || 'u1111111-1111-1111-1111-111111111111';
  const body = await req.json();

  const followUp = crmService.criarFollowUp({
    ...body,
    empresaId,
    usuarioResponsavelId: body.usuarioResponsavelId || usuarioId,
  });

  return NextResponse.json(
    {
      success: true,
      message: 'Pendência de follow-up cadastrada com sucesso',
      data: followUp,
      requestId: ctx.requestId,
    },
    { status: 201 }
  );
});
