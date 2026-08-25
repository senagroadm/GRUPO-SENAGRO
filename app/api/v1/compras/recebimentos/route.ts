import { NextRequest, NextResponse } from 'next/server';
import { comprasService } from '@/backend/modules/compras/compras-service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const empresaId = searchParams.get('empresaId') || '11111111-1111-1111-1111-111111111111';
    const pedidoCompraId = searchParams.get('pedidoCompraId') || undefined;

    const recebimentos = comprasService.getRecebimentos(empresaId, pedidoCompraId);
    return NextResponse.json({ success: true, data: recebimentos });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const empresaId = body.empresaId || '11111111-1111-1111-1111-111111111111';

    const resultado = comprasService.processarRecebimento(empresaId, {
      pedidoCompraId: body.pedidoCompraId,
      numeroNf: body.numeroNf,
      serieNf: body.serieNf || '1',
      chaveAcessoNfe: body.chaveAcessoNfe || '31260260870004000140550010001234561098421099',
      dataEmissaoNf: body.dataEmissaoNf || new Date().toISOString().split('T')[0],
      responsavelRecebimentoNome: body.responsavelRecebimentoNome || 'Almoxarife Chefe',
      conferenteQualidadeNome: body.conferenteQualidadeNome || 'Inspetor de Qualidade',
      observacoes: body.observacoes,
      itens: body.itens || [],
    });

    return NextResponse.json({
      success: true,
      data: resultado,
      message: `Recebimento ${resultado.recebimento.numero} processado com integração de Estoque, Contas a Pagar e Fiscal.`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
