import { NextRequest, NextResponse } from 'next/server';
import { engenhariaService } from '@/backend/modules/engenharia/engenharia-service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const empresaId = searchParams.get('empresaId');
    const revisaoId = searchParams.get('revisaoId') || undefined;

    if (!empresaId) {
      return NextResponse.json({ success: false, error: 'empresaId é obrigatório' }, { status: 400 });
    }

    const projetoDetalhado = engenhariaService.obterProjetoDetalhado(empresaId, id, revisaoId);
    if (!projetoDetalhado) {
      return NextResponse.json({ success: false, error: 'Projeto não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: projetoDetalhado });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
