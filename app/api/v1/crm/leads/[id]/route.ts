import { NextRequest, NextResponse } from 'next/server';
import { createSecureHandler } from '@/backend/core/security/middleware';
import { crmService } from '@/backend/modules/crm/crm-service';

export const PUT = createSecureHandler(async (req: NextRequest, ctx) => {
  const urlParts = req.nextUrl.pathname.split('/');
  const id = urlParts[urlParts.length - 1];
  const empresaId = req.headers.get('x-empresa-id') || 'e1111111-1111-1111-1111-111111111111';
  const body = await req.json();

  const leadAtualizado = crmService.atualizarLead(id, empresaId, body);

  return NextResponse.json({
    success: true,
    message: 'Lead atualizado com sucesso',
    data: leadAtualizado,
    requestId: ctx.requestId,
  });
});
