import { NextRequest, NextResponse } from 'next/server';
import { engenhariaService } from '@/backend/modules/engenharia/engenharia-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { empresaId, ...dadosArquivo } = body;

    if (!empresaId || !dadosArquivo.projetoId || !dadosArquivo.revisaoId || !dadosArquivo.nomeArquivo) {
      return NextResponse.json(
        { success: false, error: 'empresaId, projetoId, revisaoId e nomeArquivo são obrigatórios' },
        { status: 400 }
      );
    }

    const arquivoCriado = engenhariaService.vincularArquivoTecnico(empresaId, {
      ...dadosArquivo,
      autor: dadosArquivo.autor || 'Engenharia CAD/CAM',
    });

    return NextResponse.json({
      success: true,
      data: arquivoCriado,
      message: `Arquivo técnico ${arquivoCriado.nomeArquivo} anexado à revisão com sucesso.`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const empresaId = searchParams.get('empresaId');
    const arquivoId = searchParams.get('arquivoId');
    const usuarioNome = searchParams.get('usuarioNome') || 'Engenharia';

    if (!empresaId || !arquivoId) {
      return NextResponse.json({ success: false, error: 'empresaId e arquivoId são obrigatórios' }, { status: 400 });
    }

    const removido = engenhariaService.removerArquivoTecnico(empresaId, arquivoId, usuarioNome);
    if (!removido) {
      return NextResponse.json({ success: false, error: 'Arquivo não encontrado' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Arquivo técnico removido com sucesso.',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
