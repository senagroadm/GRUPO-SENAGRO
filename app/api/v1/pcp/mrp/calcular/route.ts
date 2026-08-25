import { NextRequest, NextResponse } from 'next/server';
import { pcpService } from '@/backend/modules/pcp/pcp-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const empresaId = body.empresaId || '11111111-1111-1111-1111-111111111111';

    const resultado = pcpService.executarCalculoMRP(empresaId);

    return NextResponse.json({
      success: true,
      message: 'Cálculo de MRP executado com sucesso.',
      resultado,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao recalcular MRP' },
      { status: 500 }
    );
  }
}
