import { NextRequest, NextResponse } from 'next/server';
import { comprasService } from '@/backend/modules/compras/compras-service';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const resultado = comprasService.aprovarCotacaoEEfetivarPedido(id, {
      fornecedorIdVencedor: body.fornecedorIdVencedor,
      aprovadorNome: body.aprovadorNome || 'Diretor de Operações',
      justificativaEscolha: body.justificativaEscolha,
    });

    return NextResponse.json({
      success: true,
      data: resultado,
      message: `Cotação aprovada e Pedido de Compra ${resultado.pedido.numero} emitido com sucesso.`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
