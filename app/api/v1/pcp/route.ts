import { NextRequest, NextResponse } from 'next/server';
import { pcpService } from '@/backend/modules/pcp/pcp-service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const empresaId = searchParams.get('empresaId') || '11111111-1111-1111-1111-111111111111';

    const ordensProducao = pcpService.obterOrdensProducao(empresaId);
    const maquinas = pcpService.obterMaquinas(empresaId);
    const manutencoes = pcpService.obterManutencoes(empresaId);

    return NextResponse.json({
      success: true,
      empresaId,
      totalOps: ordensProducao.length,
      totalMaquinas: maquinas.length,
      ordensProducao,
      maquinas,
      manutencoes,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erro ao carregar dados do PCP',
      },
      { status: 500 }
    );
  }
}
