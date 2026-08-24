import { NextRequest, NextResponse } from 'next/server';
import { creditoService } from '@/backend/modules/credito/credito-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.documento) {
      return NextResponse.json({ success: false, error: 'Documento (CNPJ/CPF) é obrigatório' }, { status: 400 });
    }

    const { consultaRegistro, dadosCompletos } = await creditoService.realizarConsultaBureau(
      body.documento,
      body.empresaId || 'emp-004',
      body.solicitanteId || 'usr-current',
      body.solicitanteNome || 'Analista de Crédito',
      body.tipoConsulta || 'COMPLETA_PJ'
    );

    return NextResponse.json({
      success: true,
      provider: creditoService.getProviderName(),
      registro: consultaRegistro,
      dados: dadosCompletos,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const empresaId = searchParams.get('empresaId') || undefined;
    const documento = searchParams.get('documento') || undefined;

    const consultas = creditoService.getConsultasBureau(empresaId, documento);
    return NextResponse.json({ success: true, count: consultas.length, data: consultas });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
