// app/api/v1/producao/op/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { producaoService } from '@/backend/modules/producao/producao-service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const opId = searchParams.get('id');
    const empresaId = searchParams.get('empresaId') || 'emp-01';

    if (!opId) {
      return NextResponse.json({ success: false, error: 'ID da OP é obrigatório' }, { status: 400 });
    }

    const op = producaoService.buscarOrdemPorId(opId, empresaId);
    if (!op) {
      return NextResponse.json({ success: false, error: 'Ordem de Produção não encontrada' }, { status: 404 });
    }

    const apontamentos = producaoService.listarApontamentos(empresaId, opId);
    const refugos = producaoService.listarRefugos(empresaId, opId);
    const retrabalhos = producaoService.listarRetrabalhos(empresaId, opId);

    return NextResponse.json({
      success: true,
      op,
      apontamentos,
      refugos,
      retrabalhos,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { empresaId, ...params } = body;

    if (!empresaId) {
      return NextResponse.json({ success: false, error: 'empresaId é obrigatório' }, { status: 400 });
    }

    const novaOP = producaoService.criarOrdemProducao({
      empresaId,
      ...params,
    });

    return NextResponse.json({
      success: true,
      message: `Ordem de Produção ${novaOP.numero} criada e liberada com sucesso.`,
      op: novaOP,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
