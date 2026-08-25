// app/api/v1/producao/parada/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { producaoService } from '@/backend/modules/producao/producao-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { empresaId, maquinaId, operadorId, opId, opOperacaoId, motivoCategoria, motivoDescricao } = body;

    if (!empresaId || !maquinaId || !operadorId || !motivoCategoria) {
      return NextResponse.json({ success: false, error: 'Parâmetros incompletos para iniciar parada' }, { status: 400 });
    }

    const parada = producaoService.iniciarParada({
      empresaId,
      maquinaId,
      operadorId,
      opId,
      opOperacaoId,
      motivoCategoria,
      motivoDescricao: motivoDescricao || 'Parada iniciada no terminal',
    });

    return NextResponse.json({
      success: true,
      message: 'Parada de máquina registrada e cronometrada.',
      parada,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { paradaId, empresaId, duracaoMinutosReal } = body;

    if (!paradaId || !empresaId) {
      return NextResponse.json({ success: false, error: 'paradaId e empresaId são obrigatórios' }, { status: 400 });
    }

    const parada = producaoService.finalizarParada(paradaId, empresaId, duracaoMinutosReal);

    return NextResponse.json({
      success: true,
      message: `Parada finalizada. Duração total: ${parada.duracaoMinutos} min. Impacto financeiro: R$ ${parada.impactoCustoEstimado}.`,
      parada,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
