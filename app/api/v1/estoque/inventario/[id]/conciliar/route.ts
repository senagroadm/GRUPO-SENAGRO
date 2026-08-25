import { NextRequest, NextResponse } from 'next/server';
import { estoqueService } from '@/backend/modules/estoque/estoque-service';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { empresaId, usuario, aprovador } = body;

    if (!empresaId) {
      return NextResponse.json({ success: false, error: 'empresaId é obrigatório' }, { status: 400 });
    }

    const resultado = estoqueService.conciliarInventario(
      empresaId,
      id,
      usuario || { id: 'user-01', nome: 'Supervisor Almoxarifado' },
      aprovador
    );

    return NextResponse.json({ success: true, data: resultado });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
