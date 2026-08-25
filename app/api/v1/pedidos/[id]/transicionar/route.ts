import { NextRequest, NextResponse } from 'next/server';
import { pedidoService } from '@/backend/modules/pedidos/pedido-service';
import { StatusPedido } from '@/backend/modules/pedidos/pedido-types';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    if (!body.novoStatus) {
      return NextResponse.json(
        { success: false, error: 'Parâmetro novoStatus é obrigatório.' },
        { status: 400 }
      );
    }

    const pedido = pedidoService.transicionarStatus(id, body.novoStatus as StatusPedido, {
      motivo: body.motivo,
      usuarioId: body.usuarioId || 'usr-default',
      usuarioNome: body.usuarioNome || 'Engenheiro de Processos',
      codigoRastreio: body.codigoRastreio,
      notaFiscalNumero: body.notaFiscalNumero,
      remessaNumero: body.remessaNumero,
    });

    return NextResponse.json({
      success: true,
      data: pedido,
      message: `Status do pedido atualizado com sucesso para '${pedido.status}'.`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Erro ao transicionar status do pedido' },
      { status: 400 }
    );
  }
}
