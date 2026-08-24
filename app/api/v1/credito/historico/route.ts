import { NextRequest, NextResponse } from 'next/server';
import { creditoService } from '@/backend/modules/credito/credito-service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clienteId = searchParams.get('clienteId') || undefined;
    const empresaId = searchParams.get('empresaId') || undefined;

    const pagamentos = creditoService.getHistoricoPagamentos(clienteId, empresaId);
    const relacionamentos = creditoService.getRelacionamentos(clienteId, empresaId);

    return NextResponse.json({
      success: true,
      pagamentos,
      relacionamentos,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
