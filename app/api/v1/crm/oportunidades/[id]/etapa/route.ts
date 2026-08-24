import { NextRequest, NextResponse } from 'next/server';
import { createSecureHandler } from '@/backend/core/security/middleware';
import { crmService } from '@/backend/modules/crm/crm-service';

export const POST = createSecureHandler(async (req: NextRequest, ctx) => {
  const urlParts = req.nextUrl.pathname.split('/');
  // /api/v1/crm/oportunidades/[id]/etapa
  const idIndex = urlParts.indexOf('oportunidades') + 1;
  const optId = urlParts[idIndex];

  const empresaId = req.headers.get('x-empresa-id') || 'e1111111-1111-1111-1111-111111111111';
  const body = await req.json();

  const optAtualizada = crmService.moverEtapaOportunidade(optId, empresaId, body.etapaId);

  return NextResponse.json({
    success: true,
    message: `Oportunidade movida para a etapa "${optAtualizada.etapaNome}"`,
    data: optAtualizada,
    requestId: ctx.requestId,
  });
});
