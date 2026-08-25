import { NextRequest, NextResponse } from 'next/server';
import { pedidoService } from '@/backend/modules/pedidos/pedido-service';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    if (!body.aprovacaoId || typeof body.aprovado !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'Parâmetros obrigatórios: aprovacaoId e aprovado (boolean).' },
        { status: 400 }
      );
    }

    const pedidoAtualizado = pedidoService.decidirAprovacao(id, body.aprovacaoId, {
      aprovado: body.aprovado,
      parecer: body.parecer || (body.aprovado ? 'Aprovado pela alçada técnica/comercial' : 'Reprovado'),
      aprovadorNome: body.aprovadorNome || 'Diretoria Industrial',
      cargoAprovador: body.cargoAprovador || 'DIRETOR_INDUSTRIAL',
      usuarioId: body.usuarioId || 'usr-aprovador',
    });

    const restamPendentes = pedidoAtualizado.aprovacoes.some((a) => a.status === 'PENDENTE');

    return NextResponse.json({
      success: true,
      data: pedidoAtualizado,
      todasConcluidas: !restamPendentes,
      message: body.aprovado
        ? !restamPendentes
          ? `Alçada aprovada com sucesso! Pedido liberado e avançado para '${pedidoAtualizado.status}'.`
          : 'Alçada aprovada. Restam outras aprovações pendentes.'
        : `Alçada rejeitada. Pedido alterado para '${pedidoAtualizado.status}'.`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Erro ao processar aprovação de alçada' },
      { status: 400 }
    );
  }
}
