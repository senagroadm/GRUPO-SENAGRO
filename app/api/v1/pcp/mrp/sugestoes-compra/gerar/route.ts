import { NextRequest, NextResponse } from 'next/server';
import { pcpService } from '@/backend/modules/pcp/pcp-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { empresaId, sugestaoId, usuarioNome } = body;

    if (!empresaId || !sugestaoId) {
      return NextResponse.json(
        { success: false, error: 'empresaId e sugestaoId são obrigatórios.' },
        { status: 400 }
      );
    }

    const resultado = pcpService.converterSugestaoCompraEmSolicitacao(
      empresaId,
      sugestaoId,
      usuarioNome || 'PCP Planejador'
    );

    return NextResponse.json({
      success: true,
      message: 'Solicitação de Compra gerada a partir da sugestão de MRP.',
      resultado,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao converter sugestão de compra' },
      { status: 400 }
    );
  }
}
