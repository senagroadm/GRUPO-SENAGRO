import { NextRequest, NextResponse } from 'next/server';
import { creditoService } from '@/backend/modules/credito/credito-service';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    if (!body.justificativa) {
      return NextResponse.json({ success: false, error: 'Justificativa é obrigatória para desbloqueio' }, { status: 400 });
    }

    const desbloqueado = creditoService.desbloquearCliente(id, {
      justificativa: body.justificativa,
      usuarioId: body.usuarioId || 'usr-current',
      usuarioNome: body.usuarioNome || 'Gerente Financeiro',
    });

    return NextResponse.json({ success: true, data: desbloqueado });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
