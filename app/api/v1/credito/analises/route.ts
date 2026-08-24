import { NextRequest, NextResponse } from 'next/server';
import { creditoService } from '@/backend/modules/credito/credito-service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const empresaId = searchParams.get('empresaId') || undefined;
    const status = searchParams.get('status') || undefined;

    const analises = creditoService.getAnalises(empresaId, status);
    return NextResponse.json({ success: true, count: analises.length, data: analises });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.clienteId || !body.empresaId || !body.limiteSolicitado) {
      return NextResponse.json(
        { success: false, error: 'Campos obrigatórios: clienteId, empresaId, limiteSolicitado' },
        { status: 400 }
      );
    }

    const novaAnalise = await creditoService.criarAnaliseCredito({
      empresaId: body.empresaId,
      empresaNome: body.empresaNome || 'Empresa Industrial',
      clienteId: body.clienteId,
      clienteNome: body.clienteNome || 'Cliente Não Identificado',
      cnpjCpf: body.cnpjCpf || '00.000.000/0000-00',
      limiteSolicitado: Number(body.limiteSolicitado),
      prazoPagamentoSolicitadoDias: Number(body.prazoPagamentoSolicitadoDias) || 30,
      motivoSolicitacao: body.motivoSolicitacao || 'PRIMEIRA_ANALISE',
      solicitanteNome: body.solicitanteNome || 'Analista de Crédito',
      consultarBureauAutomatico: body.consultarBureauAutomatico ?? true,
    });

    return NextResponse.json({ success: true, data: novaAnalise }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
