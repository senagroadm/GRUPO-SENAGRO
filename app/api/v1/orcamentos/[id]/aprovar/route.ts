import { NextRequest, NextResponse } from 'next/server';
import { orcamentoService } from '@/backend/modules/orcamento/orcamento-service';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const empresaIdHeader = req.headers.get('x-empresa-id');
    const body = await req.json();
    const empresaId = empresaIdHeader || body.empresaId;

    if (!empresaId) {
      return NextResponse.json({ success: false, error: 'empresaId é obrigatório' }, { status: 400 });
    }

    const { acao, justificativa } = body;
    if (!acao || (acao !== 'APROVAR' && acao !== 'REJEITAR')) {
      return NextResponse.json(
        { success: false, error: 'Ação deve ser APROVAR ou REJEITAR' },
        { status: 400 }
      );
    }
    if (!justificativa) {
      return NextResponse.json(
        { success: false, error: 'Justificativa da alçada é obrigatória' },
        { status: 400 }
      );
    }

    const aprovador = {
      id: req.headers.get('x-user-id') || 'u1111111-1111-1111-1111-111111111111',
      nome: req.headers.get('x-user-name') || 'Gerente Comercial / Diretor',
    };

    const atualizado = orcamentoService.aprovarOuRejeitar(id, empresaId, acao, justificativa, aprovador);

    return NextResponse.json({
      success: true,
      message: `Orçamento ${acao === 'APROVAR' ? 'aprovado' : 'rejeitado'} com sucesso`,
      data: atualizado,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao processar aprovação' },
      { status: error.statusCode || 500 }
    );
  }
}
