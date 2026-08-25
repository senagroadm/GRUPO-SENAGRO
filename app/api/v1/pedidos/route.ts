import { NextRequest, NextResponse } from 'next/server';
import { pedidoService } from '@/backend/modules/pedidos/pedido-service';
import { StatusPedido, OrigemPedido } from '@/backend/modules/pedidos/pedido-types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const empresaId = searchParams.get('empresaId') || undefined;
    const status = (searchParams.get('status') as StatusPedido) || undefined;
    const origem = (searchParams.get('origem') as OrigemPedido) || undefined;
    const busca = searchParams.get('busca') || undefined;

    const pedidos = pedidoService.getPedidos({ empresaId, status, origem, busca });

    return NextResponse.json({
      success: true,
      data: pedidos,
      total: pedidos.length,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Erro ao listar pedidos de venda' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.empresaId || !body.clienteNome || !body.itens || body.itens.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Dados obrigatórios ausentes (empresaId, clienteNome, itens).' },
        { status: 400 }
      );
    }

    const novoPedido = await pedidoService.criarPedidoDireto({
      empresaId: body.empresaId,
      empresaNome: body.empresaNome || 'Tritech Metalmecânica',
      clienteId: body.clienteId || 'cli-generic',
      clienteNome: body.clienteNome,
      clienteCnpjCpf: body.clienteCnpjCpf || '00.000.000/0001-00',
      itens: body.itens,
      condicaoPagamento: body.condicaoPagamento || '30 DDL',
      formaPagamento: body.formaPagamento || 'Boleto Bancário',
      tipoFrete: body.tipoFrete || 'FOB',
      prazoPrometido: body.prazoPrometido,
      vendedorId: body.vendedorId || 'usr-default',
      vendedorNome: body.vendedorNome || 'Vendedor Industrial',
      observacoesComerciais: body.observacoesComerciais,
      observacoesProducao: body.observacoesProducao,
    });

    return NextResponse.json({
      success: true,
      data: novoPedido,
      message: `Pedido #${novoPedido.numero} criado com sucesso.`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Erro ao criar pedido direto' },
      { status: 400 }
    );
  }
}
