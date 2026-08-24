import { NextRequest, NextResponse } from 'next/server';
import { creditoService } from '@/backend/modules/credito/credito-service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const empresaId = searchParams.get('empresaId') || undefined;
    const filtro = searchParams.get('filtro') || undefined;
    const clienteId = searchParams.get('clienteId') || undefined;

    if (clienteId) {
      const limite = creditoService.getLimitePorClienteId(clienteId);
      return NextResponse.json({ success: true, data: limite });
    }

    const limites = creditoService.getLimites(empresaId, filtro);
    return NextResponse.json({ success: true, count: limites.length, data: limites });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ success: false, error: 'ID do limite é obrigatório' }, { status: 400 });
    }

    const atualizado = creditoService.atualizarLimite(body.id, body);
    return NextResponse.json({ success: true, data: atualizado });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
