// app/api/v1/producao/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { producaoService } from '@/backend/modules/producao/producao-service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const empresaId = searchParams.get('empresaId') || 'emp-01';
    const status = searchParams.get('status') || undefined;
    const tipoOP = searchParams.get('tipoOP') || undefined;
    const prioridade = searchParams.get('prioridade') || undefined;
    const busca = searchParams.get('busca') || undefined;

    const ordens = producaoService.listarOrdens(empresaId, { status, tipoOP, prioridade, busca });
    const operadores = producaoService.listarOperadores(empresaId);
    const maquinas = producaoService.listarMaquinas(empresaId);
    const paradas = producaoService.listarParadas(empresaId);
    const refugos = producaoService.listarRefugos(empresaId);
    const retrabalhos = producaoService.listarRetrabalhos(empresaId);
    const apontamentos = producaoService.listarApontamentos(empresaId);
    const stats = producaoService.obterEstatisticas(empresaId);

    return NextResponse.json({
      success: true,
      ordens,
      operadores,
      maquinas,
      paradas,
      refugos,
      retrabalhos,
      apontamentos,
      stats,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
