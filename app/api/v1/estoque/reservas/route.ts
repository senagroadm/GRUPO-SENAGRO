import { NextRequest, NextResponse } from 'next/server';
import { estoqueService } from '@/backend/modules/estoque/estoque-service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const empresaId = searchParams.get('empresaId') || '44444444-4444-4444-4444-444444444444';
    const reservas = estoqueService.getReservas(empresaId);
    return NextResponse.json({ success: true, data: reservas });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { empresaId, acao, ...params } = body;

    if (!empresaId) {
      return NextResponse.json({ success: false, error: 'empresaId é obrigatório' }, { status: 400 });
    }

    if (acao === 'CANCELAR') {
      const resultado = estoqueService.cancelarReserva(
        empresaId,
        params.reservaId,
        params.motivo || 'Cancelamento solicitado pelo usuário',
        params.usuario || { id: 'user-01', nome: 'Operador Comercial' }
      );
      return NextResponse.json({ success: true, data: resultado });
    }

    const resultado = estoqueService.criarReserva(empresaId, params);
    return NextResponse.json({ success: true, data: resultado });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
