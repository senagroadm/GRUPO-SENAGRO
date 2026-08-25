import { NextRequest, NextResponse } from 'next/server';
import { pcpService } from '@/backend/modules/pcp/pcp-service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const empresaId = searchParams.get('empresaId') || '11111111-1111-1111-1111-111111111111';

    const ops = pcpService.obterOrdensProducao(empresaId);
    return NextResponse.json({ success: true, ordensProducao: ops });
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
    const { empresaId, dados } = body;

    if (!empresaId || !dados || !dados.codigoItem || !dados.quantidadePlanejada) {
      return NextResponse.json(
        { success: false, error: 'Campos obrigatórios ausentes.' },
        { status: 400 }
      );
    }

    const novaOp = pcpService.criarOrdemProducao(empresaId, dados);

    return NextResponse.json({
      success: true,
      message: 'Ordem de Produção criada com sucesso.',
      ordemProducao: novaOp,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao criar OP' },
      { status: 400 }
    );
  }
}
