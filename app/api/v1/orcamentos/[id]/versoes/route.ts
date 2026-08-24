import { NextRequest, NextResponse } from 'next/server';
import { orcamentoService } from '@/backend/modules/orcamento/orcamento-service';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const empresaId = req.headers.get('x-empresa-id') || searchParams.get('empresaId');

    if (!empresaId) {
      return NextResponse.json({ success: false, error: 'empresaId é obrigatório' }, { status: 400 });
    }

    const versoes = orcamentoService.getVersoes(id, empresaId);

    return NextResponse.json({
      success: true,
      data: versoes,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao obter versões' },
      { status: error.statusCode || 500 }
    );
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const empresaIdHeader = req.headers.get('x-empresa-id');
    const body = await req.json();
    const empresaId = empresaIdHeader || body.empresaId;

    if (!empresaId) {
      return NextResponse.json({ success: false, error: 'empresaId é obrigatório' }, { status: 400 });
    }

    const { motivoRevisao, itens } = body;
    if (!itens || !Array.isArray(itens) || itens.length === 0) {
      return NextResponse.json({ success: false, error: 'Lista de itens é obrigatória para a nova versão' }, { status: 400 });
    }

    const usuario = {
      id: req.headers.get('x-user-id') || 'u1111111-1111-1111-1111-111111111111',
      nome: req.headers.get('x-user-name') || 'Engenheiro Orçamentista',
    };

    const resultado = orcamentoService.criarNovaVersao(id, empresaId, motivoRevisao, itens, usuario);

    return NextResponse.json({
      success: true,
      message: 'Nova versão/revisão criada com sucesso',
      data: resultado,
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao criar nova versão' },
      { status: error.statusCode || 500 }
    );
  }
}
