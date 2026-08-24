import { NextRequest, NextResponse } from 'next/server';
import { creditoService } from '@/backend/modules/credito/credito-service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const empresaId = searchParams.get('empresaId') || undefined;
    const apenasAtivos = searchParams.get('apenasAtivos') === 'true';

    const bloqueios = creditoService.getBloqueios(empresaId, apenasAtivos);
    return NextResponse.json({ success: true, count: bloqueios.length, data: bloqueios });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.clienteId || !body.motivo || !body.detalhesMotivo) {
      return NextResponse.json(
        { success: false, error: 'Campos obrigatórios: clienteId, motivo, detalhesMotivo' },
        { status: 400 }
      );
    }

    const novoBloqueio = creditoService.aplicarBloqueio({
      empresaId: body.empresaId || 'GLOBAL',
      clienteId: body.clienteId,
      clienteNome: body.clienteNome || 'Cliente',
      cnpjCpf: body.cnpjCpf || '',
      tipoBloqueio: body.tipoBloqueio || 'MANUAL_USUARIO',
      motivo: body.motivo,
      detalhesMotivo: body.detalhesMotivo,
      valorTitulosVencidos: body.valorTitulosVencidos ? Number(body.valorTitulosVencidos) : undefined,
      diasMaiorAtraso: body.diasMaiorAtraso ? Number(body.diasMaiorAtraso) : undefined,
      usuarioId: body.usuarioId || 'usr-current',
      usuarioNome: body.usuarioNome || 'Operador Financeiro',
    });

    return NextResponse.json({ success: true, data: novoBloqueio }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
