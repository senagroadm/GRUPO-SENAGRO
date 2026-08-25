import { NextRequest, NextResponse } from 'next/server';
import { comprasService } from '@/backend/modules/compras/compras-service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const empresaId = searchParams.get('empresaId') || '11111111-1111-1111-1111-111111111111';
    const pedidos = comprasService.getPedidos(empresaId);
    return NextResponse.json({ success: true, data: pedidos });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
