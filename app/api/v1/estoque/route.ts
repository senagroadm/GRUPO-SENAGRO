import { NextRequest, NextResponse } from 'next/server';
import { estoqueService } from '@/backend/modules/estoque/estoque-service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const empresaId = searchParams.get('empresaId') || '44444444-4444-4444-4444-444444444444';
    const almoxarifadoId = searchParams.get('almoxarifadoId') || undefined;
    const status = searchParams.get('status') || undefined;
    const categoria = searchParams.get('categoria') || undefined;
    const search = searchParams.get('search') || undefined;

    const saldos = estoqueService.getSaldos(empresaId, { almoxarifadoId, status, categoria, search });
    const almoxarifados = estoqueService.getAlmoxarifados(empresaId);
    const localizacoes = estoqueService.getLocalizacoes(empresaId);
    const lotes = estoqueService.getLotes(empresaId);
    const reservas = estoqueService.getReservas(empresaId);
    const chapas = estoqueService.getChapas(empresaId);
    const retalhos = estoqueService.getRetalhos(empresaId);
    const sucatas = estoqueService.getSucatas(empresaId);
    const inventarios = estoqueService.getInventarios(empresaId);
    const politica = estoqueService.getPoliticaEstoque(empresaId);

    return NextResponse.json({
      success: true,
      data: {
        saldos,
        almoxarifados,
        localizacoes,
        lotes,
        reservas,
        chapas,
        retalhos,
        sucatas,
        inventarios,
        politica,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
