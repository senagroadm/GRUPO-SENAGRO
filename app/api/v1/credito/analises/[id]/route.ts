import { NextRequest, NextResponse } from 'next/server';
import { creditoService } from '@/backend/modules/credito/credito-service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const analise = creditoService.getAnaliseById(id);
    if (!analise) {
      return NextResponse.json({ success: false, error: 'Análise de crédito não encontrada' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: analise });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
