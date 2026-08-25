import { NextRequest, NextResponse } from 'next/server';
import { pcpService } from '@/backend/modules/pcp/pcp-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const empresaId = body.empresaId || '11111111-1111-1111-1111-111111111111';

    const resultadoMrp = pcpService.calcularMrp(empresaId);

    return NextResponse.json({
      success: true,
      empresaId,
      data: resultadoMrp,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erro ao processar cálculo do MRP',
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const empresaId = searchParams.get('empresaId') || '11111111-1111-1111-1111-111111111111';

    const resultadoMrp = pcpService.calcularMrp(empresaId);

    return NextResponse.json({
      success: true,
      empresaId,
      data: resultadoMrp,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erro ao carregar cálculo do MRP',
      },
      { status: 500 }
    );
  }
}
