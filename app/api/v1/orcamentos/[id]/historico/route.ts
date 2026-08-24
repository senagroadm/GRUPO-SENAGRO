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

    const historico = orcamentoService.getHistoricoNegociacao(id, empresaId);

    return NextResponse.json({
      success: true,
      data: historico,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao obter histórico' },
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

    const { tipoEvento, descricao, dadosNovos } = body;
    if (!tipoEvento || !descricao) {
      return NextResponse.json({ success: false, error: 'tipoEvento e descricao são obrigatórios' }, { status: 400 });
    }

    const usuario = {
      id: req.headers.get('x-user-id') || 'u1111111-1111-1111-1111-111111111111',
      nome: req.headers.get('x-user-name') || 'Representante Comercial',
    };

    const evento = orcamentoService.registrarEventoNegociacao({
      orcamentoId: id,
      usuarioId: usuario.id,
      usuarioNome: usuario.nome,
      tipoEvento,
      descricao,
      dadosNovos,
    });

    return NextResponse.json({
      success: true,
      data: evento,
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao registrar evento no histórico' },
      { status: error.statusCode || 500 }
    );
  }
}
