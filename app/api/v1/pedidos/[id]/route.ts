import { NextRequest, NextResponse } from 'next/server';
import { pedidoService } from '@/backend/modules/pedidos/pedido-service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const pedido = pedidoService.getPedidoById(id);

    if (!pedido) {
      return NextResponse.json({ success: false, error: 'Pedido não encontrado.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: pedido });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Erro ao buscar pedido' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const usuario = {
      id: body.usuarioId || 'usr-default',
      nome: body.usuarioNome || 'Engenheiro Comercial',
      cargo: body.usuarioCargo || 'GERENTE_COMERCIAL',
    };

    const resultado = pedidoService.aplicarAlteracaoCritica(
      id,
      {
        valorTotalPedido: body.valorTotalPedido,
        prazoPrometido: body.prazoPrometido,
        condicaoPagamento: body.condicaoPagamento,
        margemContribuicaoEstimadaPerc: body.margemContribuicaoEstimadaPerc,
        itens: body.itens,
        motivoAlteracao: body.motivoAlteracao || 'Alteração solicitada pelo usuário.',
      },
      usuario
    );

    return NextResponse.json({
      success: true,
      data: resultado.pedido,
      mudancaCritica: resultado.analise.isCritica,
      motivosMudancaCritica: resultado.analise.motivos,
      message: resultado.analise.isCritica
        ? `Mudança crítica detectada! Pedido reaberto para versão v${resultado.pedido.versaoAtual} e submetido para nova aprovação de alçada.`
        : 'Pedido atualizado com sucesso.',
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Erro ao atualizar pedido' }, { status: 400 });
  }
}
