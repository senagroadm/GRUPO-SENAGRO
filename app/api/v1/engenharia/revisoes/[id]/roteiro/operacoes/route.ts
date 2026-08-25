import { NextRequest, NextResponse } from 'next/server';
import { engenhariaService } from '@/backend/modules/engenharia/engenharia-service';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { empresaId, usuarioNome, ...dadosOp } = body;

    if (!empresaId || !dadosOp.operacaoNome || !dadosOp.setor || !dadosOp.maquina) {
      return NextResponse.json(
        { success: false, error: 'empresaId, operacaoNome, setor e maquina são obrigatórios' },
        { status: 400 }
      );
    }

    const roteiroAtualizado = engenhariaService.adicionarOperacaoRoteiro(
      empresaId,
      id,
      dadosOp,
      usuarioNome || 'Engenharia de Processos'
    );

    return NextResponse.json({
      success: true,
      data: roteiroAtualizado,
      message: `Operação ${dadosOp.operacaoNome} adicionada ao Roteiro com tempos e custos computados.`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const empresaId = searchParams.get('empresaId');
    const operacaoId = searchParams.get('operacaoId');
    const usuarioNome = searchParams.get('usuarioNome') || 'Engenharia';

    if (!empresaId || !operacaoId) {
      return NextResponse.json({ success: false, error: 'empresaId e operacaoId são obrigatórios' }, { status: 400 });
    }

    const roteiroAtualizado = engenhariaService.removerOperacaoRoteiro(empresaId, id, operacaoId, usuarioNome);
    return NextResponse.json({
      success: true,
      data: roteiroAtualizado,
      message: 'Operação removida do Roteiro com sucesso.',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
