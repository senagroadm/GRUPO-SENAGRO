import { NextRequest, NextResponse } from 'next/server';
import { createSecureHandler } from '@/backend/core/security/middleware';
import { crmService } from '@/backend/modules/crm/crm-service';

export const GET = createSecureHandler(async (req: NextRequest, ctx) => {
  const { searchParams } = new URL(req.url);
  const empresaId = req.headers.get('x-empresa-id') || searchParams.get('empresaId') || 'e1111111-1111-1111-1111-111111111111';
  const oportunidadeId = searchParams.get('oportunidadeId') || undefined;
  const leadId = searchParams.get('leadId') || undefined;

  const atividades = crmService.listarAtividades(empresaId, { oportunidadeId, leadId });

  return NextResponse.json({
    success: true,
    total: atividades.length,
    data: atividades,
    requestId: ctx.requestId,
  });
});

export const POST = createSecureHandler(async (req: NextRequest, ctx) => {
  const empresaId = req.headers.get('x-empresa-id') || 'e1111111-1111-1111-1111-111111111111';
  const usuarioId = req.headers.get('x-user-id') || 'u1111111-1111-1111-1111-111111111111';
  const body = await req.json();

  const atividade = crmService.registrarAtividade({
    ...body,
    empresaId,
    usuarioId: body.usuarioId || usuarioId,
  });

  return NextResponse.json(
    {
      success: true,
      message: 'Atividade comercial registrada com sucesso',
      data: atividade,
      requestId: ctx.requestId,
    },
    { status: 201 }
  );
});
