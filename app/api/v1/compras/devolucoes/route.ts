import { NextRequest, NextResponse } from 'next/server';
import { comprasService } from '@/backend/modules/compras/compras-service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const empresaId = searchParams.get('empresaId') || '11111111-1111-1111-1111-111111111111';
    const devolucoes = comprasService.getDevolucoes(empresaId);
    return NextResponse.json({ success: true, data: devolucoes });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const empresaId = body.empresaId || '11111111-1111-1111-1111-111111111111';

    const devolucao = comprasService.processarDevolucao(empresaId, {
      recebimentoId: body.recebimentoId,
      tipoDevolucao: body.tipoDevolucao || 'PARCIAL',
      motivoGeral: body.motivoGeral || 'Não conformidade dimensional ou química',
      numeroNfDevolucao: body.numeroNfDevolucao,
      serieNfDevolucao: body.serieNfDevolucao || '1',
      chaveAcessoNfeDevolucao: body.chaveAcessoNfeDevolucao || '31260244444444000140550010009998881098421000',
      responsavelNome: body.responsavelNome || 'Inspetor de Qualidade',
      itens: body.itens || [],
    });

    return NextResponse.json({
      success: true,
      data: devolucao,
      message: `Devolução ${devolucao.numero} processada com estorno de estoque efetuado.`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
