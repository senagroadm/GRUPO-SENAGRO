import { NextRequest, NextResponse } from 'next/server';
import { pedidoService } from '@/backend/modules/pedidos/pedido-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.orcamentoId || !body.empresaId) {
      return NextResponse.json(
        { success: false, error: 'Parâmetros obrigatórios: orcamentoId e empresaId.' },
        { status: 400 }
      );
    }

    const usuario = {
      id: body.usuarioId || 'usr-default',
      nome: body.usuarioNome || 'Engenheiro Comercial',
      cargo: body.usuarioCargo || 'GERENTE_COMERCIAL',
    };

    const pedido = await pedidoService.converterOrcamentoParaPedido(body.orcamentoId, body.empresaId, usuario);

    return NextResponse.json({
      success: true,
      data: pedido,
      message: `Orçamento convertido com sucesso no Pedido #${pedido.numero}! Versão comercial congelada e necessidades industriais calculadas.`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Erro ao converter orçamento em pedido' },
      { status: 400 }
    );
  }
}
