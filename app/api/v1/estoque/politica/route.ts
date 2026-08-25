import { NextRequest, NextResponse } from 'next/server';
import { estoqueService } from '@/backend/modules/estoque/estoque-service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const empresaId = searchParams.get('empresaId') || '44444444-4444-4444-4444-444444444444';
    const politica = estoqueService.getPoliticaEstoque(empresaId);
    return NextResponse.json({ success: true, data: politica });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { empresaId, ...dados } = body;

    if (!empresaId) {
      return NextResponse.json({ success: false, error: 'empresaId é obrigatório' }, { status: 400 });
    }

    const politicaAtualizada = estoqueService.atualizarPoliticaEstoque(empresaId, dados);
    return NextResponse.json({ success: true, data: politicaAtualizada });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
