import { NextRequest, NextResponse } from 'next/server';
import { orcamentoService } from '@/backend/modules/orcamento/orcamento-service';
import { StatusOrcamento } from '@/backend/modules/orcamento/orcamento-types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const empresaId = req.headers.get('x-empresa-id') || searchParams.get('empresaId');

    if (!empresaId) {
      return NextResponse.json(
        { success: false, error: 'Header x-empresa-id ou query param empresaId é obrigatório' },
        { status: 400 }
      );
    }

    const status = (searchParams.get('status') as StatusOrcamento) || undefined;
    const busca = searchParams.get('busca') || undefined;
    const clienteNome = searchParams.get('clienteNome') || undefined;
    const vendedorId = searchParams.get('vendedorId') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const resultado = orcamentoService.listarOrcamentos({
      empresaId,
      status,
      busca,
      clienteNome,
      vendedorId,
      page,
      limit,
    });

    return NextResponse.json({
      success: true,
      data: resultado.items,
      pagination: {
        total: resultado.total,
        page: resultado.page,
        limit: resultado.limit,
        totalPages: resultado.totalPages,
      },
      kpis: resultado.kpis,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao listar orçamentos' },
      { status: error.statusCode || 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const empresaIdHeader = req.headers.get('x-empresa-id');
    const body = await req.json();
    const empresaId = empresaIdHeader || body.empresaId;

    if (!empresaId) {
      return NextResponse.json(
        { success: false, error: 'empresaId é obrigatório' },
        { status: 400 }
      );
    }

    const usuario = {
      id: req.headers.get('x-user-id') || 'u1111111-1111-1111-1111-111111111111',
      nome: req.headers.get('x-user-name') || 'Engenheiro Orçamentista',
    };

    const novo = orcamentoService.criarOrcamento(
      {
        ...body,
        empresaId,
      },
      usuario
    );

    return NextResponse.json({
      success: true,
      message: 'Orçamento criado com sucesso',
      data: novo,
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao criar orçamento' },
      { status: error.statusCode || 500 }
    );
  }
}
