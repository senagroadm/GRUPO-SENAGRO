import { NextRequest, NextResponse } from 'next/server';
import { estoqueService } from '@/backend/modules/estoque/estoque-service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const empresaId = searchParams.get('empresaId') || '44444444-4444-4444-4444-444444444444';
    const sucatas = estoqueService.getSucatas(empresaId);
    return NextResponse.json({ success: true, data: sucatas });
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

    const sucata = estoqueService.registrarSucata(empresaId, params);
    return NextResponse.json({ success: true, data: sucata });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
