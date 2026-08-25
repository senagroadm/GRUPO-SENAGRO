// app/api/v1/producao/refugo/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { producaoService } from '@/backend/modules/producao/producao-service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const empresaId = searchParams.get('empresaId') || 'emp-01';
    const opId = searchParams.get('opId') || undefined;

    const refugos = producaoService.listarRefugos(empresaId, opId);
    return NextResponse.json({ success: true, refugos });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
