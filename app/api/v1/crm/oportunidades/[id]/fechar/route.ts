import { NextRequest, NextResponse } from 'next/server';
import { createSecureHandler } from '@/backend/core/security/middleware';
import { crmService } from '@/backend/modules/crm/crm-service';

export const POST = createSecureHandler(async (req: NextRequest, ctx) => {
  const urlParts = req.nextUrl.pathname.split('/');
  // /api/v1/crm/oportunidades/[id]/fechar
  const idIndex = urlParts.indexOf('oportunidades') + 1;
  const optId = urlParts[idIndex];

  const empresaId = req.headers.get('x-empresa-id') || 'e1111111-1111-1111-1111-111111111111';
  const usuarioId = req.headers.get('x-user-id') || 'u1111111-1111-1111-1111-111111111111';
  const body = await req.json();

  const optFechada = crmService.fecharOportunidade(optId, empresaId, {
    status: body.status, // 'GANHA' | 'PERDIDA' | 'CANCELADA'
    valorFechado: body.valorFechado,
    motivoPerdaId: body.motivoPerdaId, // Obrigatório se status === 'PERDIDA'
    detalhesPerda: body.detalhesPerda,
    concorrenteVencedor: body.concorrenteVencedor,
    usuarioId,
    usuarioNome: body.usuarioNome || 'Vendedor Comercial',
  });

  return NextResponse.json({
    success: true,
    message: `Oportunidade fechada como ${optFechada.status}`,
    data: optFechada,
    requestId: ctx.requestId,
  });
});
