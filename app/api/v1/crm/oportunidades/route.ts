import { NextRequest, NextResponse } from 'next/server';
import { createSecureHandler } from '@/backend/core/security/middleware';
import { crmService } from '@/backend/modules/crm/crm-service';

export const GET = createSecureHandler(async (req: NextRequest, ctx) => {
  const { searchParams } = new URL(req.url);
  const empresaId = req.headers.get('x-empresa-id') || searchParams.get('empresaId') || 'e1111111-1111-1111-1111-111111111111';
  const etapaId = searchParams.get('etapaId') || undefined;
  const status = searchParams.get('status') || undefined;
  const busca = searchParams.get('busca') || undefined;

  const oportunidades = crmService.listarOportunidades(empresaId, { etapaId, status, busca });

  return NextResponse.json({
    success: true,
    total: oportunidades.length,
    data: oportunidades,
    requestId: ctx.requestId,
  });
});

export const POST = createSecureHandler(async (req: NextRequest, ctx) => {
  const empresaId = req.headers.get('x-empresa-id') || 'e1111111-1111-1111-1111-111111111111';
  const usuarioId = req.headers.get('x-user-id') || 'u1111111-1111-1111-1111-111111111111';
  const body = await req.json();

  const novaOportunidade = crmService.criarOportunidade({
    ...body,
    empresaId,
    vendedorUsuarioId: body.vendedorUsuarioId || usuarioId,
  });

  return NextResponse.json(
    {
      success: true,
      message: 'Oportunidade criada com sucesso no funil de vendas',
      data: novaOportunidade,
      requestId: ctx.requestId,
    },
    { status: 201 }
  );
});
