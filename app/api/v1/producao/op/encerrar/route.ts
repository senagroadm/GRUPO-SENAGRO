// app/api/v1/producao/op/encerrar/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { producaoService } from '@/backend/modules/producao/producao-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { opId, empresaId, justificativaExplicita } = body;

    if (!opId || !empresaId) {
      return NextResponse.json({ success: false, error: 'opId e empresaId são obrigatórios' }, { status: 400 });
    }

    const resultado = producaoService.encerrarOrdemProducao({
      opId,
      empresaId,
      justificativaExplicita,
    });

    return NextResponse.json({
      success: true,
      message:
        resultado.novoStatus === 'ENCERRADA_PARCIAL'
          ? `Ordem de Produção ${resultado.op.numero} encerrada parcialmente com regra explícita e autorização gerencial.`
          : `Ordem de Produção ${resultado.op.numero} concluída com sucesso sem pendências.`,
      data: resultado,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
