import { NextRequest, NextResponse } from 'next/server';
import { orcamentoService } from '@/backend/modules/orcamento/orcamento-service';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const empresaId = req.headers.get('x-empresa-id') || searchParams.get('empresaId');

    if (!empresaId) {
      return NextResponse.json(
        { success: false, error: 'x-empresa-id header ou empresaId query param é obrigatório' },
        { status: 400 }
      );
    }

    const orcamento = orcamentoService.getOrcamentoById(id, empresaId);
    const versoes = orcamentoService.getVersoes(id, empresaId);
    const historico = orcamentoService.getHistoricoNegociacao(id, empresaId);

    return NextResponse.json({
      success: true,
      data: {
        ...orcamento,
        versoes,
        historico,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Orçamento não encontrado' },
      { status: error.statusCode || 404 }
    );
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const empresaIdHeader = req.headers.get('x-empresa-id');
    const body = await req.json();
    const empresaId = empresaIdHeader || body.empresaId;

    if (!empresaId) {
      return NextResponse.json({ success: false, error: 'empresaId é obrigatório' }, { status: 400 });
    }

    const usuario = {
      id: req.headers.get('x-user-id') || 'u1111111-1111-1111-1111-111111111111',
      nome: req.headers.get('x-user-name') || 'Engenheiro Orçamentista',
    };

    const atualizado = orcamentoService.atualizarOrcamento(id, empresaId, body, usuario);

    return NextResponse.json({
      success: true,
      message: 'Orçamento atualizado com sucesso',
      data: atualizado,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao atualizar orçamento' },
      { status: error.statusCode || 500 }
    );
  }
}
