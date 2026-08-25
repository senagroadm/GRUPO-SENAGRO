import { NextRequest, NextResponse } from 'next/server';
import { engenhariaService } from '@/backend/modules/engenharia/engenharia-service';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { empresaId, descricaoModificacoes, motivoRevisao, criadoPor, clonarRevisaoOrigemId } = body;

    if (!empresaId || !descricaoModificacoes || !motivoRevisao) {
      return NextResponse.json(
        { success: false, error: 'empresaId, descricaoModificacoes e motivoRevisao são obrigatórios' },
        { status: 400 }
      );
    }

    const projetoAtualizado = engenhariaService.criarNovaRevisao(empresaId, id, {
      descricaoModificacoes,
      motivoRevisao,
      criadoPor: criadoPor || 'Engenheiro de Produto',
      clonarRevisaoOrigemId,
    });

    return NextResponse.json({
      success: true,
      data: projetoAtualizado,
      message: `Nova ${projetoAtualizado.revisaoSelecionada?.versao} criada com sucesso em Rascunho. As versões anteriores foram preservadas intactas.`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
