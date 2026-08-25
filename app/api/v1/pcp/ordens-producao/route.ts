import { NextRequest, NextResponse } from 'next/server';
import { pcpService } from '@/backend/modules/pcp/pcp-service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const empresaId = searchParams.get('empresaId') || '11111111-1111-1111-1111-111111111111';

    const ordens = pcpService.obterOrdensProducao(empresaId);
    return NextResponse.json({ success: true, count: ordens.length, ordens });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao listar OPs' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const novaOp = pcpService.criarOrdemProducao(body);

    return NextResponse.json({
      success: true,
      mensagem: `Ordem de Produção ${novaOp.numero} criada com sucesso`,
      ordem: novaOp,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao criar OP' },
      { status: 500 }
    );
  }
}
