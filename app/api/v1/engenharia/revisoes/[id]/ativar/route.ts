import { NextRequest, NextResponse } from 'next/server';
import { engenhariaService } from '@/backend/modules/engenharia/engenharia-service';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { empresaId, projetoId, aprovadorNome, parecerAprovacao } = body;

    if (!empresaId || !projetoId) {
      return NextResponse.json(
        { success: false, error: 'empresaId e projetoId são obrigatórios' },
        { status: 400 }
      );
    }

    const projetoAtualizado = engenhariaService.ativarRevisao(empresaId, projetoId, id, {
      aprovadorNome: aprovadorNome || 'Diretoria de Engenharia',
      parecerAprovacao,
    });

    return NextResponse.json({
      success: true,
      data: projetoAtualizado,
      message: `Revisão ${projetoAtualizado.revisaoAtiva?.versao} ativada como VIGENTE com sucesso. Apenas esta revisão está ativa agora.`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
