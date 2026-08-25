import { NextRequest, NextResponse } from 'next/server';
import { pcpService } from '@/backend/modules/pcp/pcp-service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const empresaId = searchParams.get('empresaId') || '11111111-1111-1111-1111-111111111111';

    const resultadoMRP = pcpService.executarCalculoMRP(empresaId);
    const ops = pcpService.obterOrdensProducao(empresaId);
    const maquinas = pcpService.obterMaquinas(empresaId);
    const operadores = pcpService.obterOperadores(empresaId);
    const manutencoes = pcpService.obterManutencoes(empresaId);
    const calendario = pcpService.obterCalendario(empresaId);
    const demandasCarteira = pcpService.obterDemandasCarteira();

    return NextResponse.json({
      success: true,
      resultadoMRP,
      ordensProducao: ops,
      maquinas,
      operadores,
      manutencoes,
      calendario,
      demandasCarteira,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao carregar dados do PCP/MRP' },
      { status: 500 }
    );
  }
}
