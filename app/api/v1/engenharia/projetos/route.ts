import { NextRequest, NextResponse } from 'next/server';
import { engenhariaService } from '@/backend/modules/engenharia/engenharia-service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const empresaId = searchParams.get('empresaId');
    const filtroStatus = searchParams.get('status') || undefined;

    if (!empresaId) {
      return NextResponse.json({ success: false, error: 'empresaId é obrigatório' }, { status: 400 });
    }

    const projetos = engenhariaService.listarProjetos(empresaId, filtroStatus);
    return NextResponse.json({ success: true, data: projetos });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { empresaId, ...dadosProjeto } = body;

    if (!empresaId || !dadosProjeto.codigo || !dadosProjeto.titulo) {
      return NextResponse.json(
        { success: false, error: 'empresaId, codigo e titulo são obrigatórios' },
        { status: 400 }
      );
    }

    const projetoDetalhado = engenhariaService.criarProjeto(empresaId, dadosProjeto);
    return NextResponse.json(
      {
        success: true,
        data: projetoDetalhado,
        message: `Projeto ${projetoDetalhado.projeto.codigo} criado com sucesso com Revisão Inicial Rev 00.`,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
