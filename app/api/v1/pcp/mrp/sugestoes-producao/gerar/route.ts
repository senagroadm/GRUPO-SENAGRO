import { NextRequest, NextResponse } from 'next/server';
import { pcpService } from '@/backend/modules/pcp/pcp-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { empresaId, sugestaoId } = body;

    if (!empresaId || !sugestaoId) {
      return NextResponse.json(
        { success: false, error: 'empresaId e sugestaoId são obrigatórios.' },
        { status: 400 }
      );
    }

    const opGerada = pcpService.converterSugestaoProducaoEmOP(empresaId, sugestaoId);

    return NextResponse.json({
      success: true,
      message: 'Ordem de Produção criada a partir da sugestão de MRP.',
      ordemProducao: opGerada,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao converter sugestão de produção' },
      { status: 400 }
    );
  }
}
