// app/api/v1/producao/retrabalho/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { producaoService } from '@/backend/modules/producao/producao-service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const empresaId = searchParams.get('empresaId') || 'emp-01';
    const opId = searchParams.get('opId') || undefined;

    const retrabalhos = producaoService.listarRetrabalhos(empresaId, opId);
    return NextResponse.json({ success: true, retrabalhos });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { retrabalhoId, empresaId, tempoRealMinutos, custoReal, aprovadoQualidade } = body;

    if (!retrabalhoId || !empresaId) {
      return NextResponse.json({ success: false, error: 'retrabalhoId e empresaId são obrigatórios' }, { status: 400 });
    }

    const retrabalho = producaoService.concluirRetrabalho({
      retrabalhoId,
      empresaId,
      tempoRealMinutos: Number(tempoRealMinutos || 0),
      custoReal: Number(custoReal || 0),
      aprovadoQualidade: !!aprovadoQualidade,
    });

    return NextResponse.json({
      success: true,
      message: `Retrabalho concluído. Status final: ${retrabalho.status}. Custos atualizados na OP de origem.`,
      retrabalho,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
