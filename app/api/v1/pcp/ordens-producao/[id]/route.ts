import { NextRequest, NextResponse } from 'next/server';
import { pcpService } from '@/backend/modules/pcp/pcp-service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const empresaId = searchParams.get('empresaId') || '11111111-1111-1111-1111-111111111111';

    const op = pcpService.obterOrdemProducaoPorId(empresaId, id);
    if (!op) {
      return NextResponse.json({ success: false, error: 'OP não encontrada.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, ordemProducao: op });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao obter OP' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { empresaId, status, quantidadeProduzida } = body;

    if (!empresaId || !status) {
      return NextResponse.json(
        { success: false, error: 'empresaId e status são obrigatórios.' },
        { status: 400 }
      );
    }

    const opAtualizada = pcpService.atualizarStatusOP(
      empresaId,
      id,
      status,
      quantidadeProduzida
    );

    return NextResponse.json({
      success: true,
      message: `Status da OP atualizado para ${status}`,
      ordemProducao: opAtualizada,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao atualizar OP' },
      { status: 400 }
    );
  }
}
