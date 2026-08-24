import { NextRequest, NextResponse } from 'next/server';
import { createSecureHandler } from '@/backend/core/security/middleware';
import { crmService } from '@/backend/modules/crm/crm-service';

export const POST = createSecureHandler(async (req: NextRequest, ctx) => {
  const urlParts = req.nextUrl.pathname.split('/');
  // /api/v1/crm/leads/[id]/converter
  const leadIndex = urlParts.indexOf('leads') + 1;
  const leadId = urlParts[leadIndex];

  const empresaId = req.headers.get('x-empresa-id') || 'e1111111-1111-1111-1111-111111111111';
  const usuarioId = req.headers.get('x-user-id') || 'u1111111-1111-1111-1111-111111111111';
  const body = await req.json().catch(() => ({}));

  const resultado = crmService.converterLead(leadId, empresaId, {
    tituloOportunidade: body.tituloOportunidade,
    valorEstimado: body.valorEstimado,
    etapaInicialId: body.etapaInicialId,
    cnpjCpf: body.cnpjCpf,
    clienteExistenteId: body.clienteExistenteId,
    usuarioId,
    usuarioNome: body.usuarioNome || 'Vendedor Comercial',
  });

  return NextResponse.json({
    success: true,
    message: 'Lead convertido com sucesso em Cliente e Oportunidade no pipeline',
    data: resultado,
    requestId: ctx.requestId,
  });
});
