import { NextRequest, NextResponse } from 'next/server';
import { pcpService } from '@/backend/modules/pcp/pcp-service';
import { AlgoritmoSequenciamento, CentroTrabalhoMaquina } from '@/backend/modules/pcp/pcp-types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const empresaId = searchParams.get('empresaId') || '11111111-1111-1111-1111-111111111111';
    const maquinaId = searchParams.get('maquinaId');

    if (maquinaId) {
      const fila = pcpService.obterFilaPorMaquina(empresaId, maquinaId);
      return NextResponse.json({ success: true, maquinaId, fila });
    }

    const maquinas = pcpService.obterMaquinas(empresaId);
    const filasPorMaquina = maquinas.map((m: CentroTrabalhoMaquina) => ({
      maquinaId: m.id,
      maquinaNome: m.nome,
      setor: m.setor,
      taxaOcupacaoPercentual: m.taxaOcupacaoPercentual,
      status: m.status,
      fila: pcpService.obterFilaPorMaquina(empresaId, m.id),
    }));

    return NextResponse.json({ success: true, filas: filasPorMaquina });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao carregar fila de produção' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { empresaId, maquinaId, algoritmo } = body;

    if (!empresaId || !maquinaId || !algoritmo) {
      return NextResponse.json(
        { success: false, error: 'empresaId, maquinaId e algoritmo são obrigatórios.' },
        { status: 400 }
      );
    }

    const filaReordenada = pcpService.sequenciarFilaProducao(
      empresaId,
      maquinaId,
      algoritmo as AlgoritmoSequenciamento
    );

    return NextResponse.json({
      success: true,
      message: `Fila da máquina reordenada com sucesso via algoritmo ${algoritmo}`,
      maquinaId,
      algoritmo,
      fila: filaReordenada,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao sequenciar fila' },
      { status: 400 }
    );
  }
}
