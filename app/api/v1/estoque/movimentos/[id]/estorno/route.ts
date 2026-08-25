import { NextRequest, NextResponse } from 'next/server';
import { estoqueService } from '@/backend/modules/estoque/estoque-service';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { empresaId, motivoEstorno, usuario } = body;

    if (!empresaId || !motivoEstorno) {
      return NextResponse.json(
        { success: false, error: 'empresaId e motivoEstorno são obrigatórios' },
        { status: 400 }
      );
    }

    const resultado = estoqueService.estornarMovimento(
      empresaId,
      id,
      motivoEstorno,
      usuario || { id: 'user-admin', nome: 'Supervisor de Estoque' }
    );

    return NextResponse.json({ success: true, data: resultado });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
