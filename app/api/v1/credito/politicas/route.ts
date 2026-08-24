import { NextRequest, NextResponse } from 'next/server';
import { creditoService } from '@/backend/modules/credito/credito-service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const empresaId = searchParams.get('empresaId') || undefined;

    const politicas = creditoService.getPoliticas(empresaId);
    return NextResponse.json({ success: true, count: politicas.length, data: politicas });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const salva = creditoService.salvarPolitica(body);
    return NextResponse.json({ success: true, data: salva });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
