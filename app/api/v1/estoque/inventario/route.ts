import { NextRequest, NextResponse } from 'next/server';
import { estoqueService } from '@/backend/modules/estoque/estoque-service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const empresaId = searchParams.get('empresaId') || '44444444-4444-4444-4444-444444444444';
    const inventarioId = searchParams.get('inventarioId');

    if (inventarioId) {
      const itens = estoqueService.getContagensInventario(inventarioId);
      return NextResponse.json({ success: true, data: itens });
    }

    const inventarios = estoqueService.getInventarios(empresaId);
    return NextResponse.json({ success: true, data: inventarios });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { empresaId, acao, inventarioId, contagens, ...params } = body;

    if (!empresaId) {
      return NextResponse.json({ success: false, error: 'empresaId é obrigatório' }, { status: 400 });
    }

    if (acao === 'REGISTRAR_CONTAGEM') {
      const res = estoqueService.registrarContagemInventario(empresaId, inventarioId, contagens || []);
      return NextResponse.json({ success: true, data: res });
    }

    const sessao = estoqueService.iniciarInventario(empresaId, params);
    return NextResponse.json({ success: true, data: sessao });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
