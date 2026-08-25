import { NextRequest, NextResponse } from 'next/server';
import { estoqueService } from '@/backend/modules/estoque/estoque-service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const empresaId = searchParams.get('empresaId') || '44444444-4444-4444-4444-444444444444';
    const retalhos = estoqueService.getRetalhos(empresaId);
    return NextResponse.json({ success: true, data: retalhos });
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

    const retalho = estoqueService.cadastrarRetalho(empresaId, params);
    return NextResponse.json({ success: true, data: retalho });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
