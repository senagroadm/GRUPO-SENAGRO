import { NextRequest, NextResponse } from 'next/server';
import { pcpService } from '@/backend/modules/pcp/pcp-service';
import { AlgoritmoSequenciamento, CentroTrabalhoMaquina } from '@/backend/modules/pcp/pcp-types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const empresaId = searchParams.get('empresaId') || '11111111-1111-1111-1111-111111111111';
    const maquinaId = searchParams.get('maquinaId');
    const algoritmo = (searchParams.get('algoritmo') as AlgoritmoSequenciamento) || 'CRITICAL_RATIO';

    if (maquinaId) {
      const fila = pcpService.obterFilaPorMaquina(empresaId, maquinaId, algoritmo);
      return NextResponse.json({ success: true, maquinaId, fila });
    }

    const maquinas = pcpService.obterMaquinas(empresaId);
    const filasPorMaquina = maquinas.map((m: CentroTrabalhoMaquina) => ({
      maquinaId: m.id,
      maquinaNome: m.nome,
      setor: m.setor,
      taxaOcupacaoPercentual: m.taxaOcupacaoPercentual,
      fila: pcpService.obterFilaPorMaquina(empresaId, m.id, algoritmo),
    }));

    return NextResponse.json({
      success: true,
      empresaId,
      algoritmoUtilizado: algoritmo,
      filasPorMaquina,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao sequenciar fila de produção' },
      { status: 500 }
    );
  }
}
