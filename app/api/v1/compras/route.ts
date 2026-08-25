import { NextRequest, NextResponse } from 'next/server';
import { comprasService } from '@/backend/modules/compras/compras-service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const empresaId = searchParams.get('empresaId') || '11111111-1111-1111-1111-111111111111';

    const solicitacoes = comprasService.listarSolicitacoes(empresaId);
    const cotacoes = comprasService.listarCotacoes(empresaId);
    const pedidos = comprasService.getPedidos(empresaId);
    const recebimentos = comprasService.getRecebimentos(empresaId);
    const devolucoes = comprasService.getDevolucoes(empresaId);
    const historicoPrecos = comprasService.getHistoricoPrecos(empresaId);
    const fornecedoresIQF = comprasService.getAvaliacoesFornecedores(empresaId);

    return NextResponse.json({
      success: true,
      data: {
        solicitacoes,
        cotacoes,
        pedidos,
        recebimentos,
        devolucoes,
        historicoPrecos,
        fornecedoresIQF,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
