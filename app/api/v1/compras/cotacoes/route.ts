import { NextRequest, NextResponse } from 'next/server';
import { comprasService } from '@/backend/modules/compras/compras-service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const empresaId = searchParams.get('empresaId') || '11111111-1111-1111-1111-111111111111';
    const cotacoes = comprasService.listarCotacoes(empresaId);
    return NextResponse.json({ success: true, data: cotacoes });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const empresaId = body.empresaId || '11111111-1111-1111-1111-111111111111';

    const cotacao = comprasService.criarCotacao(empresaId, {
      solicitacaoId: body.solicitacaoId,
      compradorNome: body.compradorNome || 'Comprador Especialista',
      fornecedoresIds: body.fornecedoresIds || ['forn-usiminas-01', 'forn-gerdau-03', 'forn-csn-02'],
      pesosCriterios: body.pesosCriterios,
      prazoLimiteResposta: body.prazoLimiteResposta,
    });

    return NextResponse.json({
      success: true,
      data: cotacao,
      message: `Cotação ${cotacao.numero} criada e calculada com sucesso.`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
