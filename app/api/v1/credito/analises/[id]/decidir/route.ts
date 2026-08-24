import { NextRequest, NextResponse } from 'next/server';
import { creditoService } from '@/backend/modules/credito/credito-service';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    if (!body.status || !body.limiteAprovado || !body.aprovadorNome) {
      return NextResponse.json(
        { success: false, error: 'Campos obrigatórios: status, limiteAprovado, aprovadorNome' },
        { status: 400 }
      );
    }

    const analiseDecidida = creditoService.decidirAnalise(id, {
      status: body.status,
      limiteAprovado: Number(body.limiteAprovado),
      limiteConsolidadoAprovado: Number(body.limiteConsolidadoAprovado || body.limiteAprovado),
      prazoMaximoDias: Number(body.prazoMaximoDias) || 30,
      garantiaExigida: body.garantiaExigida || 'NENHUMA',
      parecerAprovador: body.parecerAprovador || 'Parecer de aprovação padrão registrado no ERP.',
      aprovadorUsuarioId: body.aprovadorUsuarioId || 'usr-current',
      aprovadorNome: body.aprovadorNome,
      aprovadorCargo: body.aprovadorCargo || 'Gerente Financeiro',
      nivelAlcada: body.nivelAlcada || 'GERENTE_FINANCEIRO',
      mesesValidade: Number(body.mesesValidade) || 6,
    });

    return NextResponse.json({ success: true, data: analiseDecidida });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
