import { NextRequest, NextResponse } from 'next/server';
import { pcpService } from '@/backend/modules/pcp/pcp-service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ordem = pcpService.obterOrdemProducaoPorId(id);

    if (!ordem) {
      return NextResponse.json(
        { success: false, error: 'Ordem de Produção não encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, ordem });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao buscar OP' },
      { status: 500 }
    );
  }
}
