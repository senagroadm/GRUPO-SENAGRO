import { NextRequest, NextResponse } from 'next/server';
import { estoqueService } from '@/backend/modules/estoque/estoque-service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const empresaId = searchParams.get('empresaId') || '44444444-4444-4444-4444-444444444444';
    const produtoId = searchParams.get('produtoId') || undefined;
    const loteId = searchParams.get('loteId') || undefined;
    const tipo = searchParams.get('tipo') || undefined;

    const movimentos = estoqueService.getMovimentos(empresaId, { produtoId, loteId, tipo });
    return NextResponse.json({ success: true, data: movimentos });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { empresaId, ...params } = body;

    if (!empresaId) {
      return NextResponse.json({ success: false, error: 'empresaId é obrigatório' }, { status: 400 });
    }

    const resultado = estoqueService.executarMovimento(empresaId, params);
    return NextResponse.json({ success: true, data: resultado });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
