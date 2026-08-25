import { NextRequest, NextResponse } from 'next/server';
import { engenhariaService } from '@/backend/modules/engenharia/engenharia-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { empresaId, projetoId, quantidade, numeroOpCustomizado, usuarioNome, forcarRevisaoId } = body;

    if (!empresaId || !projetoId || !quantidade) {
      return NextResponse.json(
        { success: false, error: 'empresaId, projetoId e quantidade são obrigatórios' },
        { status: 400 }
      );
    }

    const opVinculo = engenhariaService.emitirOrdemProducaoComRevisao(empresaId, projetoId, {
      quantidade: Number(quantidade),
      numeroOpCustomizado,
      usuarioNome: usuarioNome || 'PCP Fábrica',
      forcarRevisaoId,
    });

    return NextResponse.json({
      success: true,
      data: opVinculo,
      message: `Ordem de Produção ${opVinculo.numeroOp} emitida vinculada estritamente à ${opVinculo.revisaoVersao}. Snapshot imutável gravado.`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
