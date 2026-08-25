import { NextRequest, NextResponse } from 'next/server';
import { engenhariaService } from '@/backend/modules/engenharia/engenharia-service';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { empresaId, usuarioNome, ...dadosItem } = body;

    if (!empresaId || !dadosItem.codigo || !dadosItem.descricao) {
      return NextResponse.json(
        { success: false, error: 'empresaId, codigo e descricao são obrigatórios' },
        { status: 400 }
      );
    }

    const estruturaAtualizada = engenhariaService.adicionarItemBOM(
      empresaId,
      id,
      dadosItem,
      usuarioNome || 'Engenharia de Processos'
    );

    return NextResponse.json({
      success: true,
      data: estruturaAtualizada,
      message: `Item ${dadosItem.codigo} adicionado ao BOM com sucesso. Quantidade bruta e perdas calculadas.`,
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
    const itemId = searchParams.get('itemId');
    const usuarioNome = searchParams.get('usuarioNome') || 'Engenharia';

    if (!empresaId || !itemId) {
      return NextResponse.json({ success: false, error: 'empresaId e itemId são obrigatórios' }, { status: 400 });
    }

    const estruturaAtualizada = engenhariaService.removerItemBOM(empresaId, id, itemId, usuarioNome);
    return NextResponse.json({
      success: true,
      data: estruturaAtualizada,
      message: 'Item removido do BOM com sucesso.',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
